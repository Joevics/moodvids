
import { useState } from "react";
import { supabase, updateVoteCounter } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrCreateAnonymousId } from "@/lib/anonymousUser";
import { Movie } from "@/types/movie";
import { toast } from "sonner";

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
  upvotes: number;
  downvotes: number;
  poster_path?: string;
}

export const useTopPicks = () => {
  const queryClient = useQueryClient();
  
  const { data: topPicks = [], isLoading } = useQuery({
    queryKey: ['topPicks'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('top_picks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const picksWithTrailers = await Promise.all((data as TopPickItem[] || []).map(async (pick) => {
          if (!pick.trailer_key) {
            const trailer = await fetchMovieTrailer(pick.movie_id);
            if (trailer) {
              await supabase
                .from('top_picks')
                .update({ trailer_key: trailer })
                .eq('id', pick.id);
              return { ...pick, trailer_key: trailer };
            }
          }
          return pick;
        }));
        
        return picksWithTrailers as TopPickItem[] || [];
      } catch (error) {
        console.error('Error fetching top picks:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: userTopPicks = [] } = useQuery({
    queryKey: ['userTopPicks'],
    queryFn: async () => {
      try {
        let userId = null;
        try {
          userId = await getOrCreateAnonymousId();
        } catch (error) {
          console.error('Error getting anonymous ID:', error);
          return [];
        }

        const { data, error } = await supabase
          .from('top_picks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const picksWithTrailers = await Promise.all((data as TopPickItem[] || []).map(async (pick) => {
          if (!pick.trailer_key) {
            const trailer = await fetchMovieTrailer(pick.movie_id);
            if (trailer) {
              await supabase
                .from('top_picks')
                .update({ trailer_key: trailer })
                .eq('id', pick.id);
              return { ...pick, trailer_key: trailer };
            }
          }
          return pick;
        }));
        
        return picksWithTrailers as TopPickItem[] || [];
      } catch (error) {
        console.error('Error fetching user top picks:', error);
        return [];
      }
    },
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
            genres: movie.genres
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
      toast.success('Movie added to Top Picks');
    },
    onError: (error) => {
      toast.error('Failed to add to Top Picks');
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
      toast.success('Top Pick updated');
    },
    onError: (error) => {
      toast.error('Failed to update Top Pick');
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
      toast.success('Top Pick removed');
    },
    onError: (error) => {
      toast.error('Failed to remove Top Pick');
    }
  });

  // Simplified vote counter mutation
  const voteOnTopPick = useMutation({
    mutationFn: async ({ 
      topPickId, 
      voteType 
    }: { 
      topPickId: string, 
      voteType: 'upvote' | 'downvote'
    }) => {
      try {
        console.log("Simple vote counter called from hook:", { topPickId, voteType });
        await updateVoteCounter(topPickId, voteType);
        return { success: true, voteType };
      } catch (error) {
        console.error('Error updating vote counter:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log("Vote operation successful:", result);
      queryClient.invalidateQueries({ queryKey: ['topPicks'] });
      queryClient.invalidateQueries({ queryKey: ['userTopPicks'] });
      toast.success(`Thanks for your ${result.voteType}`);
    },
    onError: (error) => {
      console.error('Vote error:', error);
      toast.error('Failed to count your vote');
    }
  });

  const isMovieInTopPicks = (movieId: number) => {
    return userTopPicks.some(item => item.movie_id === movieId);
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
    voteOnTopPick,
    // Simple function that always returns null since we're not tracking user votes anymore
    getUserVoteType: () => null
  };
};
