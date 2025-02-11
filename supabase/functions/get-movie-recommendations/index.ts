
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const tmdbApiKey = Deno.env.get('TMDB_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences, userId } = await req.json();
    console.log('Received preferences:', preferences);
    console.log('User ID:', userId);

    // 1. Get user's watch history and past recommendations
    const { data: watchHistory } = await supabase
      .from('watch_history')
      .select('movie_id')
      .eq('user_id', userId)
      .eq('is_watched', true);

    const { data: pastRecommendations } = await supabase
      .from('recommendations')
      .select('movie_id')
      .eq('user_id', userId);

    const watchedMovieIds = new Set(watchHistory?.map(h => h.movie_id) || []);
    const recommendedMovieIds = new Set(pastRecommendations?.map(r => r.movie_id) || []);

    // 2. Get 50 movie suggestions from OpenAI
    let prompt = "Suggest 50 diverse movies based on the following preferences:\n";
    if (preferences.mood) prompt += `- Mood: ${preferences.mood}\n`;
    if (preferences.genres?.length) prompt += `- Genres: ${preferences.genres.join(', ')}\n`;
    if (preferences.contentType) prompt += `- Content Type: ${preferences.contentType}\n`;
    if (preferences.timePeriod) prompt += `- Time Period: ${preferences.timePeriod}\n`;
    if (preferences.languages?.length) prompt += `- Languages: ${preferences.languages.join(', ')}\n`;
    if (preferences.streamingServices?.length) prompt += `- Streaming Services: ${preferences.streamingServices.join(', ')}\n`;
    if (preferences.selectedPeople?.length) prompt += `- Cast/Crew: ${preferences.selectedPeople.join(', ')}\n`;
    
    prompt += "\nProvide only movie titles, one per line. Do not include any additional information.";

    console.log('Sending prompt to OpenAI:', prompt);

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a knowledgeable film curator. Provide exactly 50 movie titles that match the given preferences. Return only the titles, one per line.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorData}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI response:', openaiData);

    let movieTitles = openaiData.choices[0].message.content
      .split('\n')
      .filter(title => title.trim())
      .slice(0, 50);

    console.log('Extracted movie titles:', movieTitles);

    // 3. Get movie details from TMDb and filter out watched/recommended
    const movies = [];
    
    for (const title of movieTitles) {
      try {
        // Search for movie in TMDb
        const searchResponse = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}&language=en-US&page=1`,
        );

        if (!searchResponse.ok) {
          console.error(`TMDb search error for "${title}":`, await searchResponse.text());
          continue;
        }

        const searchData = await searchResponse.json();
        if (!searchData.results?.length) {
          console.log(`No TMDb results found for "${title}"`);
          continue;
        }

        const movieId = searchData.results[0].id;
        
        // Skip if already watched or recommended
        if (watchedMovieIds.has(movieId) || recommendedMovieIds.has(movieId)) {
          console.log(`Skipping ${title} - already watched or recommended`);
          continue;
        }

        // Get movie details
        const detailsResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}&language=en-US`,
        );

        if (!detailsResponse.ok) {
          console.error(`TMDb details error for movie ID ${movieId}:`, await detailsResponse.text());
          continue;
        }

        const movieDetails = await detailsResponse.json();
        
        // Add to recommendations
        const { error: recommendationError } = await supabase
          .from('recommendations')
          .insert({
            user_id: userId,
            movie_id: movieDetails.id,
            movie_title: movieDetails.title,
            poster_path: movieDetails.poster_path,
          });

        if (recommendationError) {
          console.error('Error inserting recommendation:', recommendationError);
        }

        movies.push({
          id: movieDetails.id,
          title: movieDetails.title,
          overview: movieDetails.overview,
          poster_path: movieDetails.poster_path,
          release_date: movieDetails.release_date,
          vote_average: movieDetails.vote_average,
          genres: movieDetails.genres.map((g: { name: string }) => g.name),
          providers: [] // We'll implement streaming providers in the next iteration
        });

        // Break if we have enough movies
        if (movies.length >= 10) break;

      } catch (error) {
        console.error(`Error fetching details for "${title}":`, error);
      }
    }

    // 4. If we don't have enough movies, get more from OpenAI
    if (movies.length < 10) {
      console.log('Not enough movies, getting more suggestions...');
      prompt = prompt.replace('50', '25'); // Ask for fewer movies in the second round
      // ... Repeat OpenAI call and TMDb fetching (implementation similar to above)
    }

    console.log(`Successfully fetched details for ${movies.length} movies`);

    return new Response(JSON.stringify({ recommendations: movies.slice(0, 10) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-movie-recommendations:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
