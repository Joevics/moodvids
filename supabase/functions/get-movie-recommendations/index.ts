
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

    console.log('Received preferences:', preferences);

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

    console.log('Sending prompt to OpenAI:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a knowledgeable film curator that provides diverse movie recommendations in JSON format.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', data);
      throw new Error('Invalid response from OpenAI API');
    }

    const recommendationsText = data.choices[0].message.content;
    
    try {
      // First try parsing the entire response as JSON
      const recommendations = JSON.parse(recommendationsText);
      return new Response(JSON.stringify({ recommendations }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.error('Error parsing recommendations:', e);
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
