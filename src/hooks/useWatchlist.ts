
import { Movie } from "@/types/movie";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateAnonymousId } from "@/lib/anonymousUser";

export const useWatchlist = () => {
  const queryClient = useQueryClient();
  const [initialized, setInitialized] = useState(false);

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
        
        if (error) throw error;
        
        // Transform to Movie type for compatibility
        return data.map(item => ({
          id: item.movie_id,
          title: item.movie_title,
          poster_path: item.poster_path || "",
          overview: "",
          release_date: "",
          vote_average: 0,
          genres: [],
        })) as Movie[];
      } catch (error) {
        console.error("Error fetching watchlist:", error);
        return [];
      }
    },
    staleTime: 60000, // 1 minute
  });

  // Initialize watchlist
  useEffect(() => {
    if (!initialized) {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      setInitialized(true);
    }
  }, [initialized, queryClient]);

  const toggleWatchlist = useMutation({
    mutationFn: async ({ movie, isInWatchlist }: { movie: Movie; isInWatchlist: boolean }) => {
      try {
        const userId = await getOrCreateAnonymousId();
        
        if (isInWatchlist) {
          // Remove from watchlist
          const { error } = await supabase
            .from('watchlist')
            .delete()
            .eq('user_id', userId)
            .eq('movie_id', movie.id);
            
          if (error) throw error;
        } else {
          // Add to watchlist
          const { error } = await supabase
            .from('watchlist')
            .upsert({
              user_id: userId,
              movie_id: movie.id,
              movie_title: movie.title,
              poster_path: movie.poster_path,
              added_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,movie_id'
            });
            
          if (error) throw error;
        }
        
        // Invalidate the watchlist query to refetch the latest data
        queryClient.invalidateQueries({ queryKey: ['watchlist'] });
        
        return watchlist;
      } catch (error) {
        console.error("Error toggling watchlist:", error);
        throw error;
      }
    }
  });

  const isInWatchlist = useCallback((movieId: number) => {
    return watchlist.some(item => item.id === movieId);
  }, [watchlist]);

  return {
    watchlist,
    isLoading,
    toggleWatchlist,
    isInWatchlist
  };
};
