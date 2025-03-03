
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types/movie";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrCreateAnonymousId } from "@/lib/anonymousUser";

// Define a type for the watch history items
interface WatchHistoryItem {
  id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  poster_path: string | null;
  is_watched: boolean;
  watched_at: string;
}

export const useWatchHistory = () => {
  const queryClient = useQueryClient();

  const { data: watchHistory = [], isLoading } = useQuery({
    queryKey: ['watchHistory'],
    queryFn: async () => {
      try {
        const userId = await getOrCreateAnonymousId();
        const { data, error } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', userId)
          .eq('is_watched', true)
          .order('watched_at', { ascending: false });

        if (error) throw error;
        return data as WatchHistoryItem[] || [];
      } catch (error) {
        console.error("Error fetching watch history:", error);
        return [];
      }
    },
    staleTime: 60000, // 1 minute
  });

  const toggleWatch = useMutation({
    mutationFn: async ({ movie, isWatched }: { movie: Movie, isWatched: boolean }) => {
      try {
        const userId = await getOrCreateAnonymousId();
        
        if (!isWatched) {
          // If removing from watched, delete the record
          const { error } = await supabase
            .from('watch_history')
            .delete()
            .eq('user_id', userId)
            .eq('movie_id', movie.id);
            
          if (error) throw error;
        } else {
          // Add/update watch record
          const { error } = await supabase
            .from('watch_history')
            .upsert({
              user_id: userId,
              movie_id: movie.id,
              movie_title: movie.title,
              poster_path: movie.poster_path,
              is_watched: true,
              watched_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,movie_id'
            });
            
          if (error) throw error;
        }
        
        // Invalidate query to refresh data
        queryClient.invalidateQueries({ queryKey: ['watchHistory'] });
        
        return null;
      } catch (error) {
        console.error("Error toggling watch status:", error);
        throw error;
      }
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
