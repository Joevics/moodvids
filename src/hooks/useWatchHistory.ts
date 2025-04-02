
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

// Local storage key
const WATCH_HISTORY_STORAGE_KEY = 'moodflix-watch-history';

// Helper function to get watch history from local storage
const getLocalWatchHistory = (): WatchHistoryItem[] => {
  try {
    const stored = localStorage.getItem(WATCH_HISTORY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading watch history from local storage:', error);
    return [];
  }
};

// Helper function to save watch history to local storage
const saveLocalWatchHistory = (history: WatchHistoryItem[]) => {
  try {
    localStorage.setItem(WATCH_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving watch history to local storage:', error);
  }
};

export const useWatchHistory = () => {
  const queryClient = useQueryClient();

  const { data: watchHistory = [], isLoading } = useQuery({
    queryKey: ['watchHistory'],
    queryFn: async () => {
      try {
        // First try to get from local storage
        const localHistory = getLocalWatchHistory();
        
        // Then try to get from Supabase
        const userId = await getOrCreateAnonymousId();
        const { data, error } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', userId)
          .eq('is_watched', true)
          .order('watched_at', { ascending: false });

        if (error) {
          console.error('Error fetching watch history from Supabase:', error);
          return localHistory;
        }

        // Merge remote data with local data
        const remoteHistory = data as WatchHistoryItem[] || [];
        
        // Use a Map to deduplicate by movie_id while preferring remote entries
        const historyMap = new Map<number, WatchHistoryItem>();
        
        // Add local entries first
        localHistory.forEach(item => {
          historyMap.set(item.movie_id, item);
        });
        
        // Then add remote entries (potentially overwriting local ones)
        remoteHistory.forEach(item => {
          historyMap.set(item.movie_id, item);
        });
        
        const mergedHistory = Array.from(historyMap.values())
          .sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime());
        
        // Save merged history to local storage
        saveLocalWatchHistory(mergedHistory);
        
        return mergedHistory;
      } catch (error) {
        console.error('Error in watch history fetch:', error);
        return getLocalWatchHistory();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const toggleWatch = useMutation({
    mutationFn: async ({ movie, isWatched }: { movie: Movie, isWatched: boolean }) => {
      try {
        // Get local history first
        const localHistory = getLocalWatchHistory();
        
        // Try to get user ID for Supabase
        const userId = await getOrCreateAnonymousId().catch(err => {
          console.error('Error getting user ID:', err);
          return null;
        });
        
        // Check for existing entry with the same state
        const existingEntry = watchHistory.find(
          item => item.movie_id === movie.id && item.is_watched === isWatched
        );
        
        // If we're trying to set to the same state as what's already in the database, do nothing
        if (existingEntry) {
          if (isWatched) {
            return existingEntry;
          } else {
            // If removing from watched, delete the entry
            let updatedHistory = localHistory.filter(item => item.movie_id !== movie.id);
            saveLocalWatchHistory(updatedHistory);
            
            // Also attempt to remove from Supabase
            if (userId) {
              const { error } = await supabase
                .from('watch_history')
                .delete()
                .eq('id', existingEntry.id)
                .catch(err => {
                  console.error('Error deleting from Supabase:', err);
                  return { error: err };
                });
              
              if (error) {
                console.error('Supabase deletion error:', error);
              }
            }
            
            // Update the cache immediately
            queryClient.setQueryData(['watchHistory'], updatedHistory);
            
            return null;
          }
        }
        
        // If setting to watched, add a new entry
        if (isWatched) {
          const timestamp = new Date().toISOString();
          const newEntry: WatchHistoryItem = {
            id: `local-${Date.now()}-${movie.id}`,
            user_id: userId || 'local',
            movie_id: movie.id,
            movie_title: movie.title,  // Store just the title for history
            poster_path: movie.poster_path,
            is_watched: true,
            watched_at: timestamp
          };
          
          // Add to local storage first
          const updatedHistory = [
            newEntry,
            ...localHistory.filter(item => item.movie_id !== movie.id)
          ];
          saveLocalWatchHistory(updatedHistory);
          
          // Also attempt to save to Supabase
          if (userId) {
            const { data, error } = await supabase
              .from('watch_history')
              .upsert({
                user_id: userId,
                movie_id: movie.id,
                movie_title: movie.title,
                poster_path: movie.poster_path,
                is_watched: true,
                watched_at: timestamp
              })
              .select()
              .single()
              .catch(err => {
                console.error('Error upserting to Supabase:', err);
                return { data: null, error: err };
              });
            
            if (error) {
              console.error('Supabase upsert error:', error);
            } else if (data) {
              // If Supabase save was successful, update the local entry with the remote ID
              const finalUpdatedHistory = updatedHistory.map(item => 
                item.id === newEntry.id ? { ...item, id: data.id } : item
              );
              saveLocalWatchHistory(finalUpdatedHistory);
            }
          }
          
          // Update the cache immediately
          queryClient.setQueryData(['watchHistory'], updatedHistory);
          
          return newEntry;
        }
        
        return null;
      } catch (error) {
        console.error('Error in toggleWatch:', error);
        throw error;
      }
    },
    onSettled: () => {
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
