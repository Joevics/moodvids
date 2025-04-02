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

// Add new handler for fetching individual movie details with trailers
const handleMovieRequest = async (movieId: number, tmdbApiKey: string) => {
  try {
    // Get movie details
    const movieResponse = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}&append_to_response=videos,watch/providers`
    );
    
    if (!movieResponse.ok) {
      throw new Error(`Failed to fetch movie details: ${movieResponse.status}`);
    }
    
    const movieData = await movieResponse.json();
    
    // Process streaming options
    const watchProviders = movieData["watch/providers"]?.results?.US || {};
    const streamingOptions = {
      stream: watchProviders.flatrate?.map((provider: any) => ({
        provider: provider.provider_name,
        url: watchProviders.link,
        logo: `https://image.tmdb.org/t/p/original${provider.logo_path}`
      })) || [],
      rent: watchProviders.rent?.map((provider: any) => ({
        provider: provider.provider_name,
        url: watchProviders.link,
        logo: `https://image.tmdb.org/t/p/original${provider.logo_path}`
      })) || [],
      buy: watchProviders.buy?.map((provider: any) => ({
        provider: provider.provider_name,
        url: watchProviders.link,
        logo: `https://image.tmdb.org/t/p/original${provider.logo_path}`
      })) || []
    };
    
    // Extract trailer
    let trailerKey = null;
    if (movieData.videos && movieData.videos.results) {
      const trailer = movieData.videos.results.find(
        (video: any) => 
          (video.type === "Trailer" || video.type === "Teaser") && 
          video.site === "YouTube"
      );
      trailerKey = trailer ? trailer.key : null;
    }
    
    // Extract genres
    const genres = movieData.genres.map((g: any) => g.name);
    
    // Create the movie object
    const movie = {
      id: movieData.id,
      title: movieData.title,
      overview: movieData.overview,
      poster_path: movieData.poster_path,
      release_date: movieData.release_date,
      vote_average: movieData.vote_average,
      genres,
      streaming_options: streamingOptions,
      trailer_key: trailerKey
    };
    
    return movie;
  } catch (error) {
    console.error("Error fetching movie details:", error);
    throw error;
  }
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { preferences, userId, movieId } = await req.json();
    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    
    if (!tmdbApiKey) {
      return new Response(
        JSON.stringify({ error: "TMDB API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If movieId is provided, fetch details for a single movie
    if (movieId) {
      const movie = await handleMovieRequest(movieId, tmdbApiKey);
      return new Response(
        JSON.stringify({ movie }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Otherwise, handle recommendations as before
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
    
    prompt += "\nProvide only movie titles, one per line. Do not include any additional information or numbering.";
    prompt += "\nFocus particularly on movies that match ALL of the specified criteria together, not just one aspect.";
    prompt += "\nEnsure great diversity in your recommendations.";
    prompt += "\nMAKE SURE to include several very recent movies (2022-2024).";

    console.log('Sending prompt to Gemini:', prompt);

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
    console.log('Gemini response:', geminiData);
    
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
