import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient, QueryFunctionContext } from "@tanstack/react-query";
import { getOrCreateAnonymousId } from "@/lib/anonymousUser";
import { Movie } from "@/types/movie";
import { toast } from "@/hooks/use-toast";
import { useTMDBMovieDetails } from "./useTMDBMovieDetails";

export interface TopPickItem {
  id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  release_year: string;
  rating: number;
  comment?: string;
  trailer_key?: string;
  genres?: string[];
  created_at: string;
  poster_path?: string;
}

// Define the page size for lazy loading
const PAGE_SIZE = 10;

export const useTopPicks = () => {
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Initialize user ID
  useEffect(() => {
    getOrCreateAnonymousId().then(id => setCurrentUserId(id)).catch(err => console.error(err));
  }, []);
  
  const fetchTopPicks = async (context: QueryFunctionContext<[string], number>) => {
    try {
      const { pageParam = 0 } = context;
      
      const { data, error } = await supabase
        .from('top_picks')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam * PAGE_SIZE) + PAGE_SIZE - 1);

      if (error) throw error;
      
      return data as TopPickItem[] || [];
    } catch (error) {
      console.error('Error fetching top picks:', error);
      return [];
    }
  };
  
  const { data: topPicks = [], isLoading } = useQuery({
    queryKey: ['topPicks'],
    queryFn: () => fetchTopPicks({ pageParam: 0, queryKey: ['topPicks'], meta: {}, signal: new AbortController().signal, direction: 'forward' }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const fetchUserTopPicks = async (context: QueryFunctionContext<[string, string], number>) => {
    try {
      const { pageParam = 0 } = context;
      
      let userId = null;
      try {
        userId = await getOrCreateAnonymousId();
        setCurrentUserId(userId);
      } catch (error) {
        console.error('Error getting anonymous ID:', error);
        return [];
      }

      const { data, error } = await supabase
        .from('top_picks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam * PAGE_SIZE) + PAGE_SIZE - 1);

      if (error) throw error;
      
      return data as TopPickItem[] || [];
    } catch (error) {
      console.error('Error fetching user top picks:', error);
      return [];
    }
  };

  const { data: userTopPicks = [] } = useQuery({
    queryKey: ['userTopPicks'],
    queryFn: () => fetchUserTopPicks({ pageParam: 0, queryKey: ['userTopPicks', ''], meta: {}, signal: new AbortController().signal, direction: 'forward' }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const fetchMovieTrailer = async (movieId: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=1cf50e6248dc270629e802686245c2c8`
      );
      const data = await response.json();
      
      let trailer = data.results?.find(
        (video: any) => 
          video.type === "Trailer" && 
          video.site === "YouTube" &&
          video.official === true
      );
      
      if (!trailer) {
        trailer = data.results?.find(
          (video: any) => 
            video.type === "Trailer" && 
            video.site === "YouTube"
        );
      }
      
      if (!trailer) {
        trailer = data.results?.find(
          (video: any) => 
            video.type === "Teaser" && 
            video.site === "YouTube"
        );
      }
      
      return trailer ? trailer.key : null;
    } catch (error) {
      console.error("Failed to fetch trailer for movie ID:", movieId, error);
      return null;
    }
  };

  const addTopPick = useMutation({
    mutationFn: async ({ 
      movie, 
      rating, 
      comment 
    }: { 
      movie: Movie, 
      rating: number, 
      comment?: string 
    }) => {
      try {
        const releaseYear = movie.release_date 
          ? movie.release_date.substring(0, 4)
          : "";
        
        const userId = await getOrCreateAnonymousId();
        setCurrentUserId(userId);
        
        let trailerKey = movie.trailer_key;
        
        if (!trailerKey) {
          trailerKey = await fetchMovieTrailer(movie.id);
        }
        
        const { data, error } = await supabase
          .from('top_picks')
          .insert({
            user_id: userId,
            movie_id: movie.id,
            movie_title: movie.title,
            release_year: releaseYear,
            rating,
            comment,
            trailer_key: trailerKey,
            genres: movie.genres,
            poster_path: movie.poster_path
          })
          .select()
          .single();

        if (error) throw error;
        return data as TopPickItem;
      } catch (error) {
        console.error('Error adding top pick:', error);
        throw error;
      }
    },
    onSuccess: (newTopPick) => {
      queryClient.invalidateQueries({ queryKey: ['topPicks'] });
      queryClient.invalidateQueries({ queryKey: ['userTopPicks'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: 'Failed to add to Top Picks',
        variant: "destructive"
      });
    }
  });

  const updateTopPick = useMutation({
    mutationFn: async ({ 
      id, 
      rating, 
      comment 
    }: { 
      id: string, 
      rating?: number, 
      comment?: string 
    }) => {
      try {
        const updateData: { rating?: number; comment?: string } = {};
        if (rating !== undefined) updateData.rating = rating;
        if (comment !== undefined) updateData.comment = comment;
        
        const { data, error } = await supabase
          .from('top_picks')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data as TopPickItem;
      } catch (error) {
        console.error('Error updating top pick:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topPicks'] });
      queryClient.invalidateQueries({ queryKey: ['userTopPicks'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: 'Failed to update Top Pick',
        variant: "destructive"
      });
    }
  });

  const deleteTopPick = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('top_picks')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return id;
      } catch (error) {
        console.error('Error deleting top pick:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topPicks'] });
      queryClient.invalidateQueries({ queryKey: ['userTopPicks'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: 'Failed to remove Top Pick',
        variant: "destructive"
      });
    }
  });

  const isMovieInTopPicks = (movieId: number) => {
    return userTopPicks.some(item => item.movie_id === movieId);
  };

  // Check if a top pick belongs to the current user
  const isUserTopPick = (topPickUserId: string) => {
    return currentUserId === topPickUserId;
  };

  return {
    topPicks,
    userTopPicks,
    isLoading,
    addTopPick,
    updateTopPick,
    deleteTopPick,
    isMovieInTopPicks,
    fetchMovieTrailer,
    isUserTopPick,
    currentUserId
  };
};
