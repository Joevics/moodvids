
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
      
      // Update the cache immediately for real-time UI updates
      const currentHistory = queryClient.getQueryData(['watchHistory']) as WatchHistoryItem[] || [];
      const updatedHistory = isWatched 
        ? [data, ...currentHistory.filter(item => item.movie_id !== movie.id)]
        : currentHistory.filter(item => item.movie_id !== movie.id);
      
      queryClient.setQueryData(['watchHistory'], updatedHistory);
      
      return data;
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
