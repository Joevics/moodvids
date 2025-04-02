
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateAnonymousId } from "@/lib/anonymousUser";
import { Movie } from "@/types/movie";
import { toast } from "sonner";

interface TopPickItem {
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

interface AddTopPickParams {
  movie: Movie;
  rating: number;
  comment?: string;
}

interface Filter {
  year?: string;
  genre?: string;
}

export const useTopPicks = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>({});

  // Fetch all top picks with optional filtering
  const query = useQuery({
    queryKey: ['top-picks', filter],
    queryFn: async () => {
      let query = supabase
        .from('top_picks')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filters if they exist
      if (filter.year) {
        query = query.eq('release_year', filter.year);
      }
      
      if (filter.genre) {
        query = query.contains('genres', [filter.genre]);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as TopPickItem[];
    }
  });

  // Add a movie to top picks
  const addTopPick = useMutation({
    mutationFn: async ({ movie, rating, comment }: AddTopPickParams) => {
      const userId = await getOrCreateAnonymousId();
      
      // Get release year from the release_date
      const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'Unknown';
      
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
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-picks'] });
      toast.success("Movie successfully added to Top Picks!");
    },
    onError: (error) => {
      console.error("Error adding top pick:", error);
      toast.error("Failed to add movie to Top Picks");
    }
  });

  // Delete a top pick
  const deleteTopPick = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('top_picks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['top-picks'] });
      toast.success("Top Pick removed successfully");
    },
    onError: (error) => {
      console.error("Error removing top pick:", error);
      toast.error("Failed to remove Top Pick");
    }
  });

  return {
    topPicks: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addTopPick,
    deleteTopPick,
    filter,
    setFilter
  };
};
