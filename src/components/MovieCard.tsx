import { useState, useEffect } from "react";
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
import { useRecommendations } from "@/hooks/useRecommendations";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MovieCardProps {
  movie: Movie;
  onWatchToggle?: () => void;
  onWatchlistToggle?: () => void;
  onDelete?: () => void;
  isNew?: boolean;
  showFullDetails?: boolean;
}

export const MovieCard = ({ 
  movie, 
  onWatchToggle, 
  onWatchlistToggle, 
  onDelete, 
  isNew,
  showFullDetails = true
}: MovieCardProps) => {
  const { toast: hookToast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);
  const { toggleWatch, isMovieWatched } = useWatchHistory();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const { removeRecommendation } = useRecommendations();
  const [isWatched, setIsWatched] = useState(isMovieWatched(movie.id));
  const [inWatchlist, setInWatchlist] = useState(isInWatchlist(movie.id));
  
  useEffect(() => {
    setIsWatched(isMovieWatched(movie.id));
    setInWatchlist(isInWatchlist(movie.id));
  }, [movie.id, isMovieWatched, isInWatchlist]);

  if (!showFullDetails) {
    return (
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <Link to={`/movie/${movie.id}`} className="block">
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
      </Card>
    );
  }

  const handleWatchToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const newWatchedState = !isMovieWatched(movie.id);
      
      await toggleWatch.mutateAsync({
        movie,
        isWatched: newWatchedState
      });
      
      toast.success(newWatchedState ? 'Added to watched' : 'Removed from watched');
      
      if (newWatchedState && onDelete) {
        await removeRecommendation.mutateAsync(movie.id);
        onDelete();
      }
      
      if (onWatchToggle) {
        onWatchToggle();
      }
    } catch (error) {
      toast.error('Failed to update watch status');
    }
  };

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const newWatchlistState = !isInWatchlist(movie.id);
      
      await toggleWatchlist.mutateAsync({
        movie,
        isInWatchlist: !newWatchlistState
      });
      
      toast.success(newWatchlistState ? 'Added to watchlist' : 'Removed from watchlist');
      
      if (newWatchlistState && onDelete) {
        await removeRecommendation.mutateAsync(movie.id);
        onDelete();
      }
      
      if (onWatchlistToggle) {
        onWatchlistToggle();
      }
    } catch (error) {
      toast.error('Failed to update watchlist');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onDelete) {
      onDelete();
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isMovieWatched(movie.id) ? "default" : "outline"}
                      onClick={handleWatchToggle}
                      disabled={toggleWatch.isPending}
                      className="flex-1 justify-center transition-all duration-300 text-xs px-2 py-1 h-8"
                      size="sm"
                    >
                      {isMovieWatched(movie.id) ? 'Watched' : 'Mark watched'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isMovieWatched(movie.id) ? 'Remove from watched' : 'Add to watched'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isInWatchlist(movie.id) ? "default" : "outline"}
                      onClick={handleWatchlistToggle}
                      disabled={toggleWatchlist.isPending}
                      className="flex-1 justify-center transition-all duration-300 text-xs px-2 py-1 h-8"
                      size="sm"
                    >
                      {isInWatchlist(movie.id) ? 'In watchlist' : 'Add to watchlist'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isInWatchlist(movie.id) ? 'Remove from watchlist' : 'Add to watchlist'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {onDelete && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDelete}
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
