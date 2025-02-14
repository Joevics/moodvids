
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
import { Badge } from "@/components/ui/badge";

interface MovieCardProps {
  movie: Movie;
  onWatchToggle?: () => void;
  onWatchlistToggle?: () => void;
  onDelete?: () => void;
  isNew?: boolean;
}

export const MovieCard = ({ movie, onWatchToggle, onWatchlistToggle, onDelete, isNew }: MovieCardProps) => {
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

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <Link to={`/movie/${movie.id}`} className="block">
        <div className="grid grid-cols-[120px,1fr] gap-4 h-[180px]">
          <div className="relative h-full">
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
          
          <div className="p-3 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-base font-semibold line-clamp-2">{movie.title}</h3>
                {isNew && (
                  <Badge variant="secondary" className="shrink-0">New</Badge>
                )}
              </div>
              
              <div className="flex items-center mb-2">
                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                <span>{movie.vote_average.toFixed(1)}</span>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {movie.overview}
              </p>
            </div>
            
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => { e.preventDefault(); handleWatch(); }}
                disabled={toggleWatch.isPending}
                className={cn(isWatched && "bg-primary text-primary-foreground")}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => { e.preventDefault(); handleWatchlist(); }}
                disabled={toggleWatchlist.isPending}
                className={cn(inWatchlist && "bg-primary text-primary-foreground")}
              >
                <Plus className="w-4 h-4" />
              </Button>
              {onDelete && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => { e.preventDefault(); onDelete(); }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
};
