
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types/movie";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrCreateAnonymousId } from "@/lib/anonymousUser";

export const useRecommendationHistory = () => {
  const queryClient = useQueryClient();

  const { data: recommendationHistory = [], isLoading } = useQuery({
    queryKey: ['recommendationHistory'],
    queryFn: async () => {
      const userId = await getOrCreateAnonymousId();
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('recommended_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const addToRecommendations = useMutation({
    mutationFn: async (movie: Movie) => {
      const userId = await getOrCreateAnonymousId();
      
      const { data, error } = await supabase
        .from('recommendations')
        .insert({
          user_id: userId,
          movie_id: movie.id,
          movie_title: movie.title,
          poster_path: movie.poster_path,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendationHistory'] });
    }
  });

  const isMovieRecommended = (movieId: number) => {
    return recommendationHistory.some(item => item.movie_id === movieId);
  };

  return {
    recommendationHistory,
    isLoading,
    addToRecommendations,
    isMovieRecommended
  };
};
