
import { supabase } from "@/integrations/supabase/client";
import { Movie, Mood, Genre, ContentType, TimePeriod, Language, StreamingService } from "@/types/movie";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

const RECOMMENDATIONS_STORAGE_KEY = 'moodflix-recommendations';

const getStoredRecommendations = (): Movie[] => {
  const stored = localStorage.getItem(RECOMMENDATIONS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const setStoredRecommendations = (movies: Movie[]) => {
  localStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(movies));
};

export const useRecommendations = (preferences?: MoviePreferences) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      if (!preferences) {
        return getStoredRecommendations();
      }

      const userId = await getOrCreateAnonymousId();
      const { data, error } = await supabase.functions.invoke('get-movie-recommendations', {
        body: { preferences, userId },
      });

      if (error) throw error;

      const newRecommendations = data.recommendations as Movie[];
      const existingRecommendations = getStoredRecommendations();
      
      // Combine new and existing recommendations, removing duplicates
      const combined = [...existingRecommendations, ...newRecommendations];
      const unique = combined.filter((movie, index) => 
        combined.findIndex(m => m.id === movie.id) === index
      );

      setStoredRecommendations(unique);
      return unique;
    },
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const removeRecommendation = useMutation({
    mutationFn: (movieId: number) => {
      const current = getStoredRecommendations();
      const updated = current.filter(movie => movie.id !== movieId);
      setStoredRecommendations(updated);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    }
  });

  return {
    ...query,
    removeRecommendation,
  };
};
