
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
}

export const useTopPicks = () => {
  const queryClient = useQueryClient();
  
  const { data: topPicks = [], isLoading } = useQuery({
    queryKey: ['topPicks'],
    queryFn: async () => {
      try {
        // Fetch all top picks (they're public according to RLS)
        const { data, error } = await supabase
          .from('top_picks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as TopPickItem[] || [];
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
        return data as TopPickItem[] || [];
      } catch (error) {
        console.error('Error fetching user top picks:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
        // Extract release year from date if available
        const releaseYear = movie.release_date 
          ? movie.release_date.substring(0, 4)
          : "";
        
        const userId = await getOrCreateAnonymousId();
        
        const { data, error } = await supabase
          .from('top_picks')
          .insert({
            user_id: userId,
            movie_id: movie.id,
            movie_title: movie.title,
            release_year: releaseYear,
            rating,
            comment,
            trailer_key: movie.trailer_key,
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
    isMovieInTopPicks
  };
};
