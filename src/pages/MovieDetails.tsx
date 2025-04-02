
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { WatchOptions } from "@/components/WatchOptions";
import { RecommendMovieModal } from "@/components/RecommendMovieModal";
import { Eye, Plus, ArrowLeft, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useWatchlist } from "@/hooks/useWatchlist";

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleWatch, isMovieWatched } = useWatchHistory();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  
  const movieQuery = useQuery({
    queryKey: ["movie", id],
    queryFn: async () => {
      if (!id) throw new Error("No movie ID provided");
      
      const { data, error } = await supabase.functions.invoke('get-movie-recommendations', {
        body: { movieId: id },
      });
      
      if (error) throw error;
      
      return data.movie;
    },
    enabled: !!id,
  });
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  
  const movie = movieQuery.data;
  const isLoading = movieQuery.isLoading;
  
  const handleBack = () => navigate(-1);
  
  if (isLoading) {
    return (
      <div className="container py-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="h-[450px] w-[300px] rounded-md" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <div className="flex space-x-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!movie) {
    return (
      <div className="container py-6 text-center">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="py-12">
          <h2 className="text-2xl font-bold">Movie not found</h2>
          <p className="mt-2 text-muted-foreground">
            We couldn't find the movie you're looking for.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        <div>
          <div className="bg-muted rounded-md overflow-hidden">
            {movie.poster_path ? (
              <img 
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-auto object-cover"
              />
            ) : (
              <div className="w-full aspect-[2/3] flex items-center justify-center bg-muted">
                No image available
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">{movie.title}</h1>
              <div className="flex items-center mt-1 text-sm">
                {movie.release_date && (
                  <span>{new Date(movie.release_date).getFullYear()}</span>
                )}
                {movie.vote_average && (
                  <div className="flex items-center ml-3">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span>{movie.vote_average.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={isMovieWatched(movie.id) ? "default" : "outline"}
                onClick={() => toggleWatch.mutateAsync({
                  movie,
                  isWatched: !isMovieWatched(movie.id)
                })}
              >
                <Eye className="mr-2 h-4 w-4" />
                {isMovieWatched(movie.id) ? "Watched" : "Mark as watched"}
              </Button>
              
              <Button 
                variant={isInWatchlist(movie.id) ? "default" : "outline"}
                onClick={() => toggleWatchlist.mutateAsync({
                  movie,
                  isInWatchlist: !isInWatchlist(movie.id)
                })}
              >
                <Plus className="mr-2 h-4 w-4" />
                {isInWatchlist(movie.id) ? "In watchlist" : "Add to watchlist"}
              </Button>
              
              {/* Add Recommend Movie button */}
              <RecommendMovieModal movie={movie} />
            </div>
          </div>
          
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>
          )}
          
          {movie.overview && (
            <div className="mt-4">
              <h2 className="font-semibold mb-2 text-lg">Overview</h2>
              <p className="text-muted-foreground">{movie.overview}</p>
            </div>
          )}
          
          {movie.trailer_key && (
            <div className="mt-6">
              <h2 className="font-semibold mb-2 text-lg">Trailer</h2>
              <div className="relative pb-[56.25%] h-0 bg-muted rounded-md overflow-hidden">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${movie.trailer_key}`}
                  title={`${movie.title} trailer`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
          
          {movie.streaming_options && (
            <div className="mt-6">
              <WatchOptions options={movie.streaming_options} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
