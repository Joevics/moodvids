
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types/movie";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrCreateAnonymousId } from "@/lib/anonymousUser";

export const useWatchlist = () => {
  const queryClient = useQueryClient();

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const userId = await getOrCreateAnonymousId();
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error fetching watchlist:', error);
        return [];
      }
      return data || [];
    }
  });

  const toggleWatchlist = useMutation({
    mutationFn: async ({ movie, isInWatchlist }: { movie: Movie, isInWatchlist: boolean }) => {
      const userId = await getOrCreateAnonymousId();
      
      if (isInWatchlist) {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', userId)
          .eq('movie_id', movie.id);

        if (error) {
          console.error('Error removing from watchlist:', error);
          throw error;
        }
        return null;
      } else {
        const { data, error } = await supabase
          .from('watchlist')
          .insert({
            user_id: userId,
            movie_id: movie.id,
            movie_title: movie.title,
            poster_path: movie.poster_path,
            providers: movie.providers || []
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding to watchlist:', error);
          throw error;
        }
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    }
  });

  const isInWatchlist = (movieId: number) => {
    return watchlist.some(item => item.movie_id === movieId);
  };

  return {
    watchlist,
    isLoading,
    toggleWatchlist,
    isInWatchlist
  };
};
