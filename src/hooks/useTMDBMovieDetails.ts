
import { Movie } from "@/types/movie";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
}

export const useTMDBMovieDetails = (movieId: number | null) => {
  return useQuery({
    queryKey: ['tmdb-movie', movieId],
    queryFn: async (): Promise<Movie | null> => {
      if (!movieId) return null;
      
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=1cf50e6248dc270629e802686245c2c8&append_to_response=videos`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch movie details');
        }
        
        const tmdbData = await response.json();
        
        // Extract trailer key if available
        let trailerKey = null;
        if (tmdbData.videos && tmdbData.videos.results) {
          const trailer = tmdbData.videos.results.find(
            (video: any) => video.type === "Trailer" && video.site === "YouTube"
          );
          
          if (trailer) {
            trailerKey = trailer.key;
          }
        }
        
        // Convert TMDB movie to our Movie type
        const movie: Movie = {
          id: tmdbData.id,
          title: tmdbData.title,
          overview: tmdbData.overview,
          poster_path: tmdbData.poster_path,
          release_date: tmdbData.release_date,
          vote_average: tmdbData.vote_average,
          genres: tmdbData.genres ? tmdbData.genres.map((g: any) => g.name.toLowerCase()) : [],
          trailer_key: trailerKey
        };
        
        return movie;
      } catch (error) {
        console.error('Error fetching TMDB movie details:', error);
        toast({
          title: "Error",
          description: "Failed to load movie details",
          variant: "destructive"
        });
        return null;
      }
    },
    enabled: !!movieId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};
