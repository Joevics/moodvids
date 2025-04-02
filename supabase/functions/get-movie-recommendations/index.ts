
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const tmdbApiKey = Deno.env.get('TMDB_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const { preferences, userId, watchedMovieTitles = [] } = await req.json();
    console.log('Received preferences:', preferences);
    console.log('User ID:', userId);
    console.log('Watched Movie Titles Count:', watchedMovieTitles.length);

    // Check if required environment variables are set
    if (!geminiApiKey || !tmdbApiKey) {
      throw new Error('Required API keys are not set');
    }

    // 1. Get user's watch history and past recommendations
    const { data: watchHistory } = await supabase
      .from('watch_history')
      .select('movie_id, movie_title')
      .eq('user_id', userId)
      .eq('is_watched', true);

    const { data: pastRecommendations } = await supabase
      .from('recommendations')
      .select('movie_id')
      .eq('user_id', userId);

    // Combine database history with passed titles
    const watchedMovieIds = new Set(watchHistory?.map(h => h.movie_id) || []);
    const recommendedMovieIds = new Set(pastRecommendations?.map(r => r.movie_id) || []);
    
    // Get all watched movie titles (from both the database and the passed array)
    const allWatchedMovieTitles = new Set([
      ...(watchHistory?.map(h => h.movie_title.toLowerCase()) || []),
      ...(watchedMovieTitles?.map((title: string) => title.toLowerCase()) || [])
    ]);

    console.log('Total unique watched titles:', allWatchedMovieTitles.size);

    // 2. Get movie suggestions from Gemini
    let prompt = "Suggest 50 EXTREMELY DIVERSE movies based on the following preferences:\n";
    
    // First add advanced search options if any
    const hasAdvancedOptions = preferences.genres?.length || preferences.contentType || 
                               preferences.timePeriod || preferences.languages?.length || 
                               preferences.selectedPeople?.length;
    
    if (hasAdvancedOptions) {
      prompt += "== PRIORITY CRITERIA ==\n";
      if (preferences.genres?.length) prompt += `- Genres: ${preferences.genres.join(', ')}\n`;
      if (preferences.contentType) prompt += `- Content Type: ${preferences.contentType}\n`;
      if (preferences.timePeriod) prompt += `- Time Period: ${preferences.timePeriod}\n`;
      if (preferences.languages?.length) {
        prompt += `- Languages: ${preferences.languages.join(', ')}\n`;
      }
      if (preferences.selectedPeople?.length) {
        prompt += `- Cast/Crew: ${preferences.selectedPeople.join(', ')}\n`;
      }
      prompt += "\n";
    }

    // Add mood if specified
    if (preferences.mood) {
      if (hasAdvancedOptions) {
        prompt += "== SECONDARY CRITERIA ==\n";
      }
      prompt += `- Mood: ${preferences.mood}\n\n`;
    }
    
    // Always ensure diversity regardless of user preferences
    prompt += "== CRITICAL DIVERSITY REQUIREMENTS ==\n";
    prompt += "- Include an EQUAL BALANCE of movies across different decades from 1950s to present\n";
    prompt += "- Include AT LEAST 10 MOVIES from the last 5 years (2019-2024)\n";
    prompt += "- Include movies with various ratings (not just highly-rated classics)\n";
    prompt += "- Ensure a wide variety of directors and production countries\n";
    prompt += "- Include equal representation of mainstream and lesser-known films\n";
    prompt += "- AVOID recommending the same popular movies that everyone knows\n";
    prompt += "- Prioritize randomness and variety over conventional popularity\n\n";
    
    // Add language preference if not already specified
    if (!preferences.languages?.length) {
      prompt += `- Languages: Include a mix, but primarily English\n`;
    }
    
    // Add list of watched movies to avoid recommending similar titles
    if (allWatchedMovieTitles.size > 0) {
      prompt += "\n== MOVIES TO AVOID RECOMMENDING (USER ALREADY WATCHED) ==\n";
      prompt += Array.from(allWatchedMovieTitles).slice(0, 50).join(", ");
      prompt += "\n\nDO NOT recommend these movies or very similar movies with almost identical titles.\n";
    }
    
    prompt += "\nProvide only movie titles, one per line. Do not include any additional information or numbering.";
    prompt += "\nFocus particularly on movies that match ALL of the specified criteria together, not just one aspect.";
    prompt += "\nEnsure great diversity in your recommendations.";
    prompt += "\nMAKE SURE to include several very recent movies (2022-2024).";

    console.log('Sending prompt to Gemini');

    // Call Gemini API for recommendations
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 1000,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${geminiResponse.status} ${errorData}`);
    }

    const geminiData = await geminiResponse.json();
    
    let movieTitles = [];
    
    // Extract movie titles from Gemini response
    if (geminiData.candidates && geminiData.candidates.length > 0 && 
        geminiData.candidates[0].content && 
        geminiData.candidates[0].content.parts && 
        geminiData.candidates[0].content.parts.length > 0) {
      
      const responseText = geminiData.candidates[0].content.parts[0].text;
      
      movieTitles = responseText
        .split('\n')
        .filter(title => title.trim())
        .map(title => title.replace(/^\d+\.\s*/, '')) // Remove any numbering
        .slice(0, 50);
    }

    console.log('Extracted movie titles:', movieTitles.length);

    // 3. Get movie details from TMDb and filter out watched/recommended
    const movies = [];
    
    for (const title of movieTitles) {
      try {
        // Skip if the title is in the watched list (case insensitive)
        if (allWatchedMovieTitles.has(title.toLowerCase())) {
          console.log(`Skipping ${title} - already in watch history`);
          continue;
        }
        
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
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}&language=en-US&append_to_response=watch/providers`,
        );

        if (!detailsResponse.ok) {
          console.error(`TMDb details error for movie ID ${movieId}:`, await detailsResponse.text());
          continue;
        }

        const movieDetails = await detailsResponse.json();
        
        // Extract streaming providers
        const providers = movieDetails['watch/providers']?.results?.US?.flatrate || [];
        const providerNames = providers.map((p: { provider_name: string }) => p.provider_name);

        const movie = {
          id: movieDetails.id,
          title: movieDetails.title,
          overview: movieDetails.overview,
          poster_path: movieDetails.poster_path,
          release_date: movieDetails.release_date,
          vote_average: movieDetails.vote_average,
          genres: movieDetails.genres.map((g: { name: string }) => g.name),
          providers: providerNames
        };

        movies.push(movie);

        // Break if we have enough movies
        if (movies.length >= 5) break;

      } catch (error) {
        console.error(`Error fetching details for "${title}":`, error);
      }
    }

    console.log(`Successfully fetched details for ${movies.length} movies`);

    // Add recommendations to the database
    if (movies.length) {
      const recommendationsToInsert = movies.map((movie) => ({
        user_id: userId,
        movie_id: movie.id,
        movie_title: movie.title,
        poster_path: movie.poster_path,
        providers: movie.providers || [],
      }));

      const { error: insertError } = await supabase
        .from('recommendations')
        .upsert(recommendationsToInsert);

      if (insertError) {
        console.error('Error inserting recommendations:', insertError);
        throw insertError;
      }
    }

    return new Response(JSON.stringify({ recommendations: movies }), {
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
