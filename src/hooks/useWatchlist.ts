
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types/movie";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrCreateAnonymousId } from "@/lib/anonymousUser";
import { toast } from "sonner";

export const useWatchlist = () => {
  const queryClient = useQueryClient();

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      try {
        const userId = await getOrCreateAnonymousId();
        const { data, error } = await supabase
          .from('watchlist')
          .select('*')
          .eq('user_id', userId)
          .order('added_at', { ascending: false });

        if (error) {
          console.error('Error fetching watchlist:', error);
          throw error;
        }
        return data || [];
      } catch (error) {
        console.error('Error in watchlist query:', error);
        return [];
      }
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
        toast.success('Removed from watchlist');
        return null;
      } else {
        try {
          const { data, error } = await supabase
            .from('watchlist')
            .upsert({
              user_id: userId,
              movie_id: movie.id,
              movie_title: movie.title,
              poster_path: movie.poster_path,
              providers: movie.providers || []
            }, {
              onConflict: 'user_id,movie_id'
            })
            .select()
            .single();

          if (error) {
            console.error('Error adding to watchlist:', error);
            throw error;
          }
          toast.success('Added to watchlist');
          return data;
        } catch (error) {
          if (error.code === '23505') { // Duplicate key error
            console.log('Movie already in watchlist');
            return null;
          }
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (error) => {
      console.error('Watchlist operation failed:', error);
      toast.error('Failed to update watchlist');
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
