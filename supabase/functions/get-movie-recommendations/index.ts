
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define types directly in the edge function
type Mood =
  | "happy"
  | "sad"
  | "excited"
  | "romantic"
  | "nostalgic"
  | "adventurous"
  | "relaxed"
  | "inspired";

type Genre =
  | "action"
  | "comedy"
  | "drama"
  | "horror"
  | "sci-fi"
  | "fantasy"
  | "romance"
  | "thriller"
  | "documentary";

type ContentType = "movie" | "tv" | "anime" | "documentary";
type TimePeriod = "classic" | "90s" | "2000s" | "latest";
type Language = 
  | "english"
  | "spanish"
  | "french"
  | "korean"
  | "japanese"
  | "chinese";
type StreamingService = 
  | "netflix"
  | "disney"
  | "prime"
  | "hulu"
  | "hbo"
  | "apple";

interface MoviePreferences {
  mood?: Mood;
  genres?: Genre[];
  contentType?: ContentType;
  timePeriod?: TimePeriod;
  languages?: Language[];
  streamingServices?: StreamingService[];
  selectedPeople?: string[];
}

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  genres: string[];
  providers?: string[];
}

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const tmdbApiKey = Deno.env.get('TMDB_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences } = await req.json();
    console.log('Received preferences:', preferences);

    // 1. Get movie suggestions from OpenAI
    let prompt = "Suggest 10 diverse movies based on the following preferences:\n";
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
            content: 'You are a knowledgeable film curator. Provide exactly 10 movie titles that match the given preferences. Return only the titles, one per line.'
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

    const movieTitles = openaiData.choices[0].message.content
      .split('\n')
      .filter(title => title.trim())
      .slice(0, 10);

    console.log('Extracted movie titles:', movieTitles);

    // 2. Get detailed movie information from TMDb
    const movies: Movie[] = [];
    
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

        // Get first result's details
        const movieId = searchData.results[0].id;
        const detailsResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}&language=en-US`,
        );

        if (!detailsResponse.ok) {
          console.error(`TMDb details error for movie ID ${movieId}:`, await detailsResponse.text());
          continue;
        }

        const movieDetails = await detailsResponse.json();
        
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

      } catch (error) {
        console.error(`Error fetching details for "${title}":`, error);
      }
    }

    console.log(`Successfully fetched details for ${movies.length} movies`);

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
