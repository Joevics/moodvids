import { Movie } from "@/types/movie";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";

const WATCHLIST_STORAGE_KEY = 'moodflix-watchlist';
const MOVIE_DETAILS_STORAGE_KEY = 'moodflix-movie-details';

const getStoredWatchlist = (): Movie[] => {
  try {
    const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    // Sort by most recent first if data exists
    if (stored) {
      const watchlist = JSON.parse(stored);
      return watchlist.sort((a: Movie, b: Movie) => {
        // If added_at exists, use it for sorting
        if (a.added_at && b.added_at) {
          return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
        }
        return 0;
      });
    }
  } catch (error) {
    console.error('Error reading watchlist from local storage:', error);
  }
  return [];
};

const getStoredMovieDetails = (): Record<number, Movie> => {
  try {
    const stored = localStorage.getItem(MOVIE_DETAILS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading movie details from local storage:', error);
    return {};
  }
};

const setStoredMovieDetails = (movieDetails: Record<number, Movie>) => {
  try {
    localStorage.setItem(MOVIE_DETAILS_STORAGE_KEY, JSON.stringify(movieDetails));
  } catch (error) {
    console.error('Error saving movie details to local storage:', error);
  }
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
      try {
        const currentWatchlist = getStoredWatchlist();
        const movieDetails = getStoredMovieDetails();
        
        let newWatchlist;
        if (isInWatchlist) {
          // Remove from watchlist
          newWatchlist = currentWatchlist.filter(item => item.id !== movie.id);
        } else {
          // Store complete movie details when adding to watchlist
          movieDetails[movie.id] = movie;
          setStoredMovieDetails(movieDetails);
          
          // Check if movie already exists in watchlist to prevent duplicates
          const existingMovie = currentWatchlist.find(item => item.id === movie.id);
          if (!existingMovie) {
            // Add to watchlist only if it doesn't exist already
            // Add timestamp for sorting
            const movieWithTimestamp = {
              ...movie,
              added_at: new Date().toISOString()
            };
            newWatchlist = [movieWithTimestamp, ...currentWatchlist];
          } else {
            // Movie already exists, return current watchlist unchanged
            newWatchlist = currentWatchlist;
          }
        }
        
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist));
        
        // Immediately update the cache for real-time UI updates
        queryClient.setQueryData(['watchlist'], newWatchlist);
        
        return newWatchlist;
      } catch (error) {
        console.error('Error updating watchlist in local storage:', error);
        throw error;
      }
    }
  });

  const getMovieDetails = useCallback((movieId: number): Movie | undefined => {
    // First check if it's in the watchlist
    const movieInWatchlist = watchlist.find(item => item.id === movieId);
    if (movieInWatchlist) return movieInWatchlist;
    
    // Then check in the stored movie details
    const movieDetails = getStoredMovieDetails();
    return movieDetails[movieId];
  }, [watchlist]);

  const isInWatchlist = useCallback((movieId: number) => {
    return watchlist.some(item => item.id === movieId);
  }, [watchlist]);

  return {
    watchlist,
    isLoading: false,
    toggleWatchlist,
    isInWatchlist,
    getMovieDetails
  };
};
