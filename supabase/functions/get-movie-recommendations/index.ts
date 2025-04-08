
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

    // 2. Get content suggestions from Gemini with improved prompt
    let prompt = "You are an expert content recommendation specialist with extensive knowledge of films, TV series, and media trends across all decades.\n\n";
    prompt += "Suggest 50 highly diverse items based on the following preferences:\n";
    
    // Determine if we're looking for movies or TV series
    const contentType = preferences.contentType || 'movie';
    const isTV = contentType === 'tv';
    
    // First add advanced search options if any
    const hasAdvancedOptions = preferences.genres?.length || preferences.contentType || 
                               preferences.timePeriod || preferences.languages?.length || 
                               preferences.selectedPeople?.length;
    
    if (hasAdvancedOptions) {
      prompt += "== PRIORITY CRITERIA ==\n";
      if (preferences.genres?.length) prompt += `- Genres: ${preferences.genres.join(', ')}\n`;
      
      // Handle content type more appropriately
      if (preferences.contentType) {
        if (preferences.contentType === 'tv') {
          prompt += `- Content Type: TV Series/Shows (NOT movies)\n`;
        } else if (preferences.contentType === 'movie') {
          prompt += `- Content Type: Feature Films (NOT TV series)\n`;
        } else if (preferences.contentType === 'anime') {
          prompt += `- Content Type: Anime (both movies and series)\n`;
        } else if (preferences.contentType === 'documentary') {
          prompt += `- Content Type: Documentary (both movies and series)\n`;
        } else if (preferences.contentType === 'cartoon') {
          prompt += `- Content Type: Animated/Cartoon content (both movies and series)\n`;
        }
      }
      
      // Handle time periods more accurately
      if (preferences.timePeriod) {
        if (preferences.timePeriod === 'latest') {
          prompt += `- Time Period: Content from 2020-2025, with emphasis on 2025 releases\n`;
        } else if (preferences.timePeriod === '2000s') {
          prompt += `- Time Period: Content from 2000-2019\n`;
        } else if (preferences.timePeriod === '90s') {
          prompt += `- Time Period: Content from 1990-1999\n`;
        } else if (preferences.timePeriod === 'classic') {
          prompt += `- Time Period: Content from 1950-1989\n`;
        }
      }
      
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
    
    // Specifically adjust for movies vs TV shows
    if (isTV) {
      prompt += "- YOU MUST ONLY SUGGEST TV SERIES, NOT MOVIES\n";
      prompt += "- Include TV series across different decades, with more emphasis on recent series\n";
      prompt += "- Include AT LEAST 3 TV SERIES from 2020-2025 (with at least one from 2025 if possible)\n";
      prompt += "- Include AT LEAST 2 TV SERIES from before 2020\n";
    } else {
      prompt += "- Include an EQUAL BALANCE of movies across different decades from 1950s to present\n";
      prompt += "- Include AT LEAST 3 MOVIES from 2020-2025 (with at least one from 2025 if possible)\n";
      prompt += "- Include AT LEAST 2 MOVIES from before 2020\n";
    }
    
    prompt += "- Include content with various ratings (not just highly-rated classics)\n";
    prompt += "- Ensure a wide variety of directors and production countries\n";
    prompt += "- Include equal representation of mainstream and lesser-known titles\n";
    prompt += "- AVOID recommending the same popular titles that everyone knows\n";
    prompt += "- Prioritize randomness and variety over conventional popularity\n\n";
    
    // Add language preference if not already specified
    if (!preferences.languages?.length) {
      prompt += `- Languages: Include a mix, but primarily English\n`;
    }
    
    // Add list of watched movies to avoid recommending similar titles
    if (allWatchedMovieTitles.size > 0) {
      prompt += "\n== CONTENT TO AVOID RECOMMENDING (USER ALREADY WATCHED) ==\n";
      prompt += Array.from(allWatchedMovieTitles).slice(0, 50).join(", ");
      prompt += "\n\nDO NOT recommend these titles or very similar ones with almost identical titles.\n";
    }
    
    prompt += "\nProvide only titles, one per line. Do not include any additional information, numbering, or explanations.";
    prompt += "\nFocus particularly on content that matches ALL of the specified criteria together, not just one aspect.";
    prompt += "\nEnsure great diversity in your recommendations.";
    
    if (isTV) {
      prompt += "\nMAKE SURE to include several very recent TV SERIES (2023-2025).";
      prompt += "\nREMEMBER: ONLY SUGGEST TV SERIES/SHOWS, NOT MOVIES.";
    } else {
      prompt += "\nMAKE SURE to include several very recent MOVIES (2023-2025).";
    }

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
    
    let contentTitles = [];
    
    // Extract titles from Gemini response
    if (geminiData.candidates && geminiData.candidates.length > 0 && 
        geminiData.candidates[0].content && 
        geminiData.candidates[0].content.parts && 
        geminiData.candidates[0].content.parts.length > 0) {
      
      const responseText = geminiData.candidates[0].content.parts[0].text;
      
      contentTitles = responseText
        .split('\n')
        .filter(title => title.trim())
        .map(title => title.replace(/^\d+\.\s*/, '')) // Remove any numbering
        .slice(0, 50);
    }

    console.log('Extracted titles:', contentTitles.length);

    // 3. Get content details from TMDb and filter out watched/recommended
    const contents = [];
    let recentCount = 0;
    let olderCount = 0;
    const maxRecent = 3; // We want 3 recent items (2020-2025)
    const maxOlder = 2; // We want 2 older items (before 2020)
    
    for (const title of contentTitles) {
      try {
        // Skip if the title is in the watched list (case insensitive)
        if (allWatchedMovieTitles.has(title.toLowerCase())) {
          console.log(`Skipping ${title} - already in watch history`);
          continue;
        }
        
        // Search for content in TMDb
        const searchType = isTV ? 'tv' : 'movie';
        const searchResponse = await fetch(
          `https://api.themoviedb.org/3/search/${searchType}?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}&language=en-US&page=1`,
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

        const contentId = searchData.results[0].id;
        
        // Skip if already watched or recommended
        if (watchedMovieIds.has(contentId) || recommendedMovieIds.has(contentId)) {
          console.log(`Skipping ${title} - already watched or recommended`);
          continue;
        }

        // Get content details
        const detailsResponse = await fetch(
          `https://api.themoviedb.org/3/${searchType}/${contentId}?api_key=${tmdbApiKey}&language=en-US&append_to_response=watch/providers`,
        );

        if (!detailsResponse.ok) {
          console.error(`TMDb details error for content ID ${contentId}:`, await detailsResponse.text());
          continue;
        }

        const contentDetails = await detailsResponse.json();
        
        // Extract release date and year
        const releaseDate = isTV ? contentDetails.first_air_date : contentDetails.release_date;
        const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 0;
        const isRecent = releaseYear >= 2020;
        
        // Check if we've reached our quota for recent/older content
        if (isRecent && recentCount >= maxRecent) continue;
        if (!isRecent && olderCount >= maxOlder) continue;
        
        // Extract streaming providers
        const providers = contentDetails['watch/providers']?.results?.US?.flatrate || [];
        const providerNames = providers.map((p: { provider_name: string }) => p.provider_name);

        const content = {
          id: contentDetails.id,
          title: isTV ? contentDetails.name : contentDetails.title,
          overview: contentDetails.overview,
          poster_path: contentDetails.poster_path,
          release_date: releaseDate,
          vote_average: contentDetails.vote_average,
          genres: contentDetails.genres.map((g: { name: string }) => g.name),
          providers: providerNames,
          media_type: isTV ? 'tv' : 'movie'
        };

        contents.push(content);
        
        // Increment our counters
        if (isRecent) {
          recentCount++;
        } else {
          olderCount++;
        }

        // Break if we have enough content of both types
        if (recentCount >= maxRecent && olderCount >= maxOlder) break;

      } catch (error) {
        console.error(`Error fetching details for "${title}":`, error);
      }
    }

    console.log(`Successfully fetched details for ${contents.length} items (${recentCount} recent, ${olderCount} older)`);

    // Add recommendations to the database
    if (contents.length) {
      const recommendationsToInsert = contents.map((content) => ({
        user_id: userId,
        movie_id: content.id,
        movie_title: content.title,
        poster_path: content.poster_path,
        providers: content.providers || [],
        media_type: content.media_type
      }));

      const { error: insertError } = await supabase
        .from('recommendations')
        .upsert(recommendationsToInsert);

      if (insertError) {
        console.error('Error inserting recommendations:', insertError);
        throw insertError;
      }
    }

    return new Response(JSON.stringify({ recommendations: contents }), {
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
