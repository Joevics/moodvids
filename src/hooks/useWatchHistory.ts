
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types/movie";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrCreateAnonymousId } from "@/lib/anonymousUser";

export const useWatchHistory = () => {
  const queryClient = useQueryClient();

  const { data: watchHistory = [], isLoading } = useQuery({
    queryKey: ['watchHistory'],
    queryFn: async () => {
      const userId = await getOrCreateAnonymousId();
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', userId)
        .order('watched_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const toggleWatch = useMutation({
    mutationFn: async ({ movie, isWatched }: { movie: Movie, isWatched: boolean }) => {
      const userId = await getOrCreateAnonymousId();
      
      const { data, error } = await supabase
        .from('watch_history')
        .upsert({
          user_id: userId,
          movie_id: movie.id,
          movie_title: movie.title,
          poster_path: movie.poster_path,
          is_watched: isWatched
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchHistory'] });
    }
  });

  const isMovieWatched = (movieId: number) => {
    return watchHistory.some(item => item.movie_id === movieId && item.is_watched);
  };

  return {
    watchHistory,
    isLoading,
    toggleWatch,
    isMovieWatched
  };
};
