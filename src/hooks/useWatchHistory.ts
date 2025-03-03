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
      return data as WatchHistoryItem[] || [];
    }
  });

  const toggleWatch = useMutation({
    mutationFn: async ({ movie, isWatched }: { movie: Movie, isWatched: boolean }) => {
      const userId = await getOrCreateAnonymousId();
      
      // Check if the movie already exists in watch history
      const existingEntry = watchHistory.find(item => item.movie_id === movie.id);
      
      // If trying to mark a movie as watched that's already watched, return early
      if (isWatched && existingEntry && existingEntry.is_watched) {
        return existingEntry;
      }
      
      // If we're removing from history (isWatched=false) and it doesn't exist, nothing to do
      if (!isWatched && !existingEntry) {
        return null;
      }
      
      // If removing from history, delete the record
      if (!isWatched && existingEntry) {
        const { error } = await supabase
          .from('watch_history')
          .delete()
          .eq('id', existingEntry.id);
          
        if (error) throw error;
        
        // Update the cache by removing the item
        queryClient.setQueryData(['watchHistory'], 
          watchHistory.filter(item => item.id !== existingEntry.id));
        
        return null;
      }
      
      // Otherwise, add or update the record
      const { data, error } = await supabase
        .from('watch_history')
        .upsert({
          user_id: userId,
          movie_id: movie.id,
          movie_title: movie.title,
          poster_path: movie.poster_path,
          is_watched: isWatched,
          watched_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,movie_id'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update the cache
      // If the entry already exists, replace it, otherwise add it to the top
      const updatedHistory = existingEntry
        ? watchHistory.map(item => item.id === existingEntry.id ? data as WatchHistoryItem : item)
        : [data as WatchHistoryItem, ...watchHistory.filter(item => item.movie_id !== movie.id)];
      
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
