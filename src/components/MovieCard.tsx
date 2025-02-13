
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Movie } from "@/types/movie";
import { Eye, Plus, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Link } from "react-router-dom";

interface MovieCardProps {
  movie: Movie;
  onWatchToggle?: () => void;
  onWatchlistToggle?: () => void;
  onDelete?: () => void;
}

export const MovieCard = ({ movie, onWatchToggle, onWatchlistToggle, onDelete }: MovieCardProps) => {
  const { toast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);
  const { toggleWatch, isMovieWatched } = useWatchHistory();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const [isWatched, setIsWatched] = useState(isMovieWatched(movie.id));
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist(movie.id));

  const handleWatch = async () => {
    const newWatchedState = !isWatched;
    setIsWatched(newWatchedState);
    try {
      await toggleWatch.mutateAsync({ movie, isWatched: newWatchedState });
      toast({
        title: newWatchedState ? "Added to watched" : "Removed from watched",
        description: movie.title,
      });
      if (newWatchedState && onWatchToggle) {
        onWatchToggle();
      }
    } catch (error) {
      setIsWatched(!newWatchedState);
      toast({
        title: "Error",
        description: "Failed to update watch status",
        variant: "destructive",
      });
    }
  };

  const handleWatchlist = async () => {
    const newWatchlistState = !inWatchlist;
    setInWatchlist(newWatchlistState);
    try {
      await toggleWatchlist.mutateAsync({ movie, isInWatchlist: !newWatchlistState });
      toast({
        title: newWatchlistState ? "Added to watchlist" : "Removed from watchlist",
        description: movie.title,
      });
      if (newWatchlistState && onWatchlistToggle) {
        onWatchlistToggle();
      }
    } catch (error) {
      setInWatchlist(!newWatchlistState);
      toast({
        title: "Error",
        description: "Failed to update watchlist",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      toast({
        title: "Removed from recommendations",
        description: movie.title,
      });
    }
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <Link to={`/movie/${movie.id}`} className="w-full md:w-48 flex-shrink-0">
          <div className="relative aspect-[2/3]">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className={cn(
                "object-cover w-full h-full",
                !imageLoaded && "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </Link>
        
        <div className="flex-1 p-4">
          <Link to={`/movie/${movie.id}`}>
            <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">
              {movie.title}
            </h3>
          </Link>
          
          <div className="flex items-center mb-2">
            <Star className="w-4 h-4 text-yellow-400 mr-1" />
            <span>{movie.vote_average.toFixed(1)}</span>
          </div>
          
          <p className="text-muted-foreground mb-4 line-clamp-2">
            {movie.overview}
          </p>

          {movie.providers && movie.providers.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Available on: {movie.providers.join(', ')}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleWatch}
              disabled={toggleWatch.isPending}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWatchlist}
              disabled={toggleWatchlist.isPending}
            >
              <Plus className="w-4 h-4" />
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
