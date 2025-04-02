import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrCreateAnonymousId } from "@/lib/anonymousUser";
import { Movie, UserPreferences } from "@/types/movie";
import { useWatchHistory } from "./useWatchHistory";
import { useWatchlist } from "./useWatchlist";

// Local storage key for recommendations
const RECOMMENDATIONS_STORAGE_KEY = 'moodflix-recommendations';

// Get recommendations from local storage
const getLocalRecommendations = (): Movie[] => {
  try {
    const stored = localStorage.getItem(RECOMMENDATIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading recommendations from local storage:', error);
    return [];
  }
};

// Save recommendations to local storage
const saveLocalRecommendations = (recommendations: Movie[]) => {
  try {
    localStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(recommendations));
    // Also store the timestamp of when recommendations were last generated
    localStorage.setItem('recommendations-generated-at', new Date().toISOString());
  } catch (error) {
    console.error('Error saving recommendations to local storage:', error);
  }
};

export const useRecommendations = (preferences?: UserPreferences) => {
  const queryClient = useQueryClient();
  const [recommendationsCache, setRecommendationsCache] = useState<Movie[]>(getLocalRecommendations);
  const { watchHistory } = useWatchHistory();
  const { watchlist } = useWatchlist();

  // Keep local cache in sync with localStorage
  useEffect(() => {
    setRecommendationsCache(getLocalRecommendations());
  }, []);

  // When watchHistory or watchlist changes, filter recommendations to remove any movies that are now in history or watchlist
  useEffect(() => {
    const currentRecommendations = getLocalRecommendations();
    
    if (currentRecommendations.length > 0) {
      const watchedMovieIds = new Set(watchHistory.map(item => item.movie_id));
      const watchlistMovieIds = new Set(watchlist.map(item => item.id));
      
      const filteredRecommendations = currentRecommendations.filter(movie => 
        !watchedMovieIds.has(movie.id) && !watchlistMovieIds.has(movie.id)
      );
      
      if (filteredRecommendations.length !== currentRecommendations.length) {
        saveLocalRecommendations(filteredRecommendations);
        setRecommendationsCache(filteredRecommendations);
      }
    }
  }, [watchHistory, watchlist]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['recommendations', preferences],
    queryFn: async () => {
      try {
        const userId = await getOrCreateAnonymousId();
        
        // Get watched movie titles (necessary for filtering)
        const watchedMovieTitles = new Set(watchHistory.map(item => item.movie_title.toLowerCase()));
        const watchedMovieIds = new Set(watchHistory.map(item => item.movie_id));
        const watchlistMovieIds = new Set(watchlist.map(item => item.id));
        
        // Call Supabase Edge Function to get recommendations
        const { data, error } = await supabase.functions.invoke('get-movie-recommendations', {
          body: {
            preferences: preferences || {},
            userId,
            watchedMovieTitles: Array.from(watchedMovieTitles) // Send the movie titles to prevent recommending similar titles
          }
        });
        
        if (error) throw error;
        
        if (data?.recommendations) {
          // Add timestamp for UI updates
          const now = new Date().toISOString();
          const recommendationsWithTimestamp = data.recommendations.map((movie: Movie) => ({
            ...movie,
            generated_at: now
          }));
          
          // Filter out any movies that are in watch history or watchlist
          const filteredRecommendations = recommendationsWithTimestamp.filter((movie: Movie) => 
            !watchedMovieIds.has(movie.id) && !watchlistMovieIds.has(movie.id)
          );
          
          // Save to local storage
          saveLocalRecommendations(filteredRecommendations);
          
          return filteredRecommendations;
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        return recommendationsCache; // Return cached recommendations if fetching fails
      }
    },
    enabled: false // Don't run automatically, only when refetch is called
  });

  const removeRecommendation = useMutation({
    mutationFn: async (movieId: number) => {
      try {
        // Remove from local storage
        const currentRecommendations = getLocalRecommendations();
        const filteredRecommendations = currentRecommendations.filter(movie => movie.id !== movieId);
        saveLocalRecommendations(filteredRecommendations);
        
        // Try to remove from Supabase if possible
        const userId = await getOrCreateAnonymousId().catch(() => null);
        if (userId) {
          await supabase
            .from('recommendations')
            .delete()
            .eq('user_id', userId)
            .eq('movie_id', movieId);
        }
        
        return movieId;
      } catch (error) {
        console.error('Error removing recommendation:', error);
        throw error;
      }
    },
    onSuccess: (movieId) => {
      // Update cache with filtered recommendations
      queryClient.setQueryData(['recommendations', preferences], (oldData: Movie[] = []) => {
        return oldData.filter(movie => movie.id !== movieId);
      });
      
      // Also update local cache
      setRecommendationsCache(prev => prev.filter(movie => movie.id !== movieId));
    }
  });

  // Ensure returned data includes cached recommendations if no data from the query
  const recommendationsData = data || recommendationsCache;

  return {
    data: recommendationsData,
    isLoading,
    isFetching,
    error,
    refetch,
    removeRecommendation,
  };
};
