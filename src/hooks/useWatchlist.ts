
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

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getStoredWatchlist,
    staleTime: Infinity,
  });

  const toggleWatchlist = useMutation({
    mutationFn: async ({ movie, isInWatchlist }: { movie: Movie; isInWatchlist: boolean }) => {
      const currentWatchlist = getStoredWatchlist();
      const exists = currentWatchlist.some(item => item.id === movie.id);
      
      let newWatchlist;
      if (exists) {
        newWatchlist = currentWatchlist.filter(item => item.id !== movie.id);
      } else {
        newWatchlist = [...currentWatchlist, movie];
      }
      
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist));
      
      // Immediately update the cache for real-time UI updates
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
