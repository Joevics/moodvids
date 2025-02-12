
import { supabase } from "@/integrations/supabase/client";
import { Movie, Mood, Genre, ContentType, TimePeriod, Language, StreamingService } from "@/types/movie";
import { useQuery } from "@tanstack/react-query";
import { getOrCreateAnonymousId } from "@/lib/anonymousUser";

interface MoviePreferences {
  mood?: Mood;
  genres?: Genre[];
  contentType?: ContentType;
  timePeriod?: TimePeriod;
  languages?: Language[];
  streamingServices?: StreamingService[];
  selectedPeople?: string[];
}

export const useRecommendations = (preferences: MoviePreferences) => {
  return useQuery({
    queryKey: ['recommendations', preferences],
    queryFn: async () => {
      const userId = await getOrCreateAnonymousId();
      const { data, error } = await supabase.functions.invoke('get-movie-recommendations', {
        body: { preferences, userId },
      });

      if (error) throw error;

      // Add providers to the recommendations table
      if (data.recommendations?.length) {
        const recommendationsToInsert = data.recommendations.map((movie: Movie) => ({
          user_id: userId,
          movie_id: movie.id,
          movie_title: movie.title,
          poster_path: movie.poster_path,
          providers: movie.providers || [],
        }));

        await supabase
          .from('recommendations')
          .upsert(recommendationsToInsert, { onConflict: 'movie_id,user_id' });
      }

      return data.recommendations as Movie[];
    },
    enabled: false, // Only fetch when explicitly triggered
    staleTime: Infinity, // Prevents auto-refresh
    gcTime: Infinity, // Keeps data cached indefinitely (replacing cacheTime)
  });
};
