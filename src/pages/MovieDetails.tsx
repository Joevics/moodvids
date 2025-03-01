
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Eye, Plus, Star, Calendar } from "lucide-react";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Movie } from "@/types/movie";

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toggleWatch, isMovieWatched } = useWatchHistory();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const [isLoading, setIsLoading] = useState(true);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [year, setYear] = useState<string>("");
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setIsLoading(true);
        const recommendations = JSON.parse(localStorage.getItem('moodflix-recommendations') || '[]');
        const foundMovie = recommendations.find((m: Movie) => m.id === Number(id));
        
        if (foundMovie) {
          setMovie(foundMovie);
          
          // Extract year from release_date
          if (foundMovie.release_date) {
            const yearMatch = foundMovie.release_date.match(/^\d{4}/);
            setYear(yearMatch ? yearMatch[0] : "");
          }
          
          // Fetch trailer from TMDB if not already available
          if (!foundMovie.trailer_key) {
            try {
              const response = await fetch(
                `https://api.themoviedb.org/3/movie/${id}/videos?api_key=1cf50e6248dc270629e802686245c2c8`
              );
              const data = await response.json();
              const trailer = data.results?.find(
                (video: any) => 
                  (video.type === "Trailer" || video.type === "Teaser") && 
                  video.site === "YouTube"
              );
              if (trailer) {
                setTrailerKey(trailer.key);
              }
            } catch (error) {
              console.error("Failed to fetch trailer:", error);
            }
          } else {
            setTrailerKey(foundMovie.trailer_key);
          }
        } else {
          toast.error('Movie not found');
        }
      } catch (error) {
        console.error('Error fetching movie details:', error);
        toast.error('Failed to load movie details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  // Function to get the streaming service logo URL
  const getStreamingLogo = (provider: string) => {
    const logoMap: Record<string, string> = {
      "Netflix": "https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme@master/icons/netflix.svg",
      "Disney+": "https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme@master/icons/disney.svg",
      "Prime Video": "https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme@master/icons/aws.svg",
      "Hulu": "https://seeklogo.com/images/H/hulu-logo-21DD3D9555-seeklogo.com.png",
      "HBO Max": "https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme@master/icons/haxe.svg",
      "Apple TV+": "https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme@master/icons/apple.svg"
    };

    return logoMap[provider] || null;
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
        <Button onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Go back
        </Button>
      </div>
    );
  }

  const handleWatchToggle = async () => {
    try {
      await toggleWatch.mutateAsync({
        movie,
        isWatched: !isMovieWatched(movie.id)
      });
      toast.success(isMovieWatched(movie.id) ? 'Removed from watched' : 'Added to watched');
    } catch (error) {
      toast.error('Failed to update watch status');
    }
  };

  const handleWatchlistToggle = async () => {
    try {
      await toggleWatchlist.mutateAsync({
        movie,
        isInWatchlist: !isInWatchlist(movie.id)
      });
      toast.success(isInWatchlist(movie.id) ? 'Removed from watchlist' : 'Added to watchlist');
    } catch (error) {
      toast.error('Failed to update watchlist');
    }
  };

  return (
    <div className="container py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid md:grid-cols-[300px,1fr] gap-8">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
          <img
            src={`https://image.tmdb.org/t/p/original${movie.poster_path}`}
            alt={movie.title}
            className="object-cover w-full h-full"
          />
        </div>

        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold">{movie.title}</h1>
              {year && (
                <div className="flex items-center text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{year}</span>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-400 mr-1" />
              <span className="text-lg">{movie.vote_average.toFixed(1)}</span>
            </div>
          </div>

          <p className="text-lg text-muted-foreground mb-6">{movie.overview}</p>

          <div className="flex gap-4 mb-8">
            <Button
              variant={isMovieWatched(movie.id) ? "default" : "outline"}
              onClick={handleWatchToggle}
              disabled={toggleWatch.isPending}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isMovieWatched(movie.id) ? 'Watched' : 'Mark as watched'}
            </Button>
            <Button
              variant={isInWatchlist(movie.id) ? "default" : "outline"}
              onClick={handleWatchlistToggle}
              disabled={toggleWatchlist.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isInWatchlist(movie.id) ? 'In watchlist' : 'Add to watchlist'}
            </Button>
          </div>

          {trailerKey && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Trailer</h2>
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${trailerKey}`}
                  title={`${movie.title} trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          )}

          {movie.providers && movie.providers.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Available on</h2>
              <div className="flex flex-wrap gap-4">
                {movie.providers.map((provider: string) => {
                  const logoUrl = getStreamingLogo(provider);
                  return logoUrl ? (
                    <div key={provider} className="flex flex-col items-center">
                      <div className="w-12 h-12 p-2 rounded-full bg-white/10 flex items-center justify-center">
                        <img
                          src={logoUrl}
                          alt={provider}
                          className="w-8 h-8 object-contain"
                          title={provider}
                        />
                      </div>
                      <span className="text-xs mt-1">{provider}</span>
                    </div>
                  ) : (
                    <Badge key={provider} variant="secondary">
                      {provider}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
