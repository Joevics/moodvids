
import { Card } from "@/components/ui/card";
import { Movie } from "@/types/movie";
import { Eye, EyeOff, Bookmark, BookmarkX, PlayCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useWatchlist } from "@/hooks/useWatchlist";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
  const { toast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);
  const { toggleWatch, isMovieWatched } = useWatchHistory();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const [isWatched, setIsWatched] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    setIsWatched(isMovieWatched(movie.id));
    setInWatchlist(isInWatchlist(movie.id));
  }, [movie.id, isMovieWatched, isInWatchlist]);

  const handleWatch = async () => {
    const newWatchedState = !isWatched;
    setIsWatched(newWatchedState);
    
    try {
      await toggleWatch.mutateAsync({ movie, isWatched: newWatchedState });
      toast({
        title: newWatchedState ? "Added to watched" : "Removed from watched",
        description: movie.title,
      });
    } catch (error) {
      console.error('Error updating watch status:', error);
      setIsWatched(!newWatchedState); // Revert on error
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
    } catch (error) {
      console.error('Error updating watchlist status:', error);
      setInWatchlist(!newWatchlistState); // Revert on error
      toast({
        title: "Error",
        description: "Failed to update watchlist",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:scale-105">
      <div className="aspect-[2/3] relative overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
          className={cn(
            "object-cover w-full h-full transition-opacity duration-300",
            !imageLoaded && "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="p-4 flex flex-col h-full justify-between">
            <div>
              <h3 className="text-white font-semibold mb-2">{movie.title}</h3>
              <p className="text-white/80 text-sm line-clamp-3">{movie.overview}</p>
            </div>
            <div className="space-y-4">
              {movie.providers && movie.providers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.providers.map((provider, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-white/20 p-1 rounded-full">
                            <PlayCircle className="w-4 h-4 text-white" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Available on {provider}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-white/90 text-sm">
                  {new Date(movie.release_date).getFullYear()}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-primary"
                    onClick={handleWatch}
                    disabled={toggleWatch.isPending}
                  >
                    {isWatched ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-primary"
                    onClick={handleWatchlist}
                    disabled={toggleWatchlist.isPending}
                  >
                    {inWatchlist ? <BookmarkX className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
