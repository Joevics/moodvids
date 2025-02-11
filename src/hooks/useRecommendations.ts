
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
      return data.recommendations as Movie[];
    },
    enabled: false, // Only fetch when explicitly triggered
  });
};
