
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Movie, Mood, Genre, ContentType, TimePeriod, Language, StreamingService } from "../../../src/types/movie.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { mood, genres, contentType, timePeriod, languages, streamingServices, selectedPeople } = preferences;

    let prompt = "Suggest 50 movies based on the following preferences:\n";
    if (mood) prompt += `- Mood: ${mood}\n`;
    if (genres?.length) prompt += `- Genres: ${genres.join(', ')}\n`;
    if (contentType) prompt += `- Content Type: ${contentType}\n`;
    if (timePeriod) prompt += `- Time Period: ${timePeriod}\n`;
    if (languages?.length) prompt += `- Languages: ${languages.join(', ')}\n`;
    if (streamingServices?.length) prompt += `- Streaming Services: ${streamingServices.join(', ')}\n`;
    if (selectedPeople?.length) prompt += `- Cast/Crew: ${selectedPeople.join(', ')}\n`;
    
    prompt += "\nProvide the response in the following JSON format for each movie:\n";
    prompt += '{"title": "Movie Title", "overview": "Brief description", "genres": ["Genre1", "Genre2"], "release_date": "YYYY-MM-DD"}';
    prompt += "\nEnsure diversity in genres, release years, and languages. Avoid overly mainstream movies unless specifically requested.";

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are a knowledgeable film curator that provides diverse movie recommendations in JSON format.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    const recommendationsText = data.choices[0].message.content;
    
    try {
      const recommendations = JSON.parse(recommendationsText);
      return new Response(JSON.stringify({ recommendations }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      // If the response isn't valid JSON, try to extract array of movies from the text
      const moviesMatch = recommendationsText.match(/\[[\s\S]*\]/);
      if (moviesMatch) {
        const recommendations = JSON.parse(moviesMatch[0]);
        return new Response(JSON.stringify({ recommendations }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('Failed to parse recommendations');
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
