
import { Movie } from "@/types/movie";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";

const WATCHLIST_STORAGE_KEY = 'moodflix-watchlist';

const getStoredWatchlist = (): Movie[] => {
  const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const useWatchlist = () => {
  const queryClient = useQueryClient();
  const [initialized, setInitialized] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    if (!initialized) {
      queryClient.setQueryData(['watchlist'], getStoredWatchlist());
      setInitialized(true);
    }
  }, [queryClient, initialized]);

  const { data: watchlist = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getStoredWatchlist,
    staleTime: Infinity,
  });

  const toggleWatchlist = useMutation({
    mutationFn: async ({ movie, isInWatchlist }: { movie: Movie; isInWatchlist: boolean }) => {
      const currentWatchlist = getStoredWatchlist();
      
      let newWatchlist;
      if (isInWatchlist) {
        // Remove from watchlist
        newWatchlist = currentWatchlist.filter(item => item.id !== movie.id);
      } else {
        // Check if movie already exists in watchlist to prevent duplicates
        const existingMovie = currentWatchlist.find(item => item.id === movie.id);
        if (!existingMovie) {
          // Add to watchlist only if it doesn't exist already
          newWatchlist = [...currentWatchlist, movie];
        } else {
          // Movie already exists, return current watchlist unchanged
          newWatchlist = currentWatchlist;
          return newWatchlist; // Return early to prevent cache update for existing movie
        }
      }
      
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist));
      
      // Only update the cache if the watchlist actually changed
      queryClient.setQueryData(['watchlist'], newWatchlist);
      
      return newWatchlist;
    }
  });

  const isInWatchlist = useCallback((movieId: number) => {
    return watchlist.some(item => item.id === movieId);
  }, [watchlist]);

  return {
    watchlist,
    isLoading: false,
    toggleWatchlist,
    isInWatchlist
  };
};
