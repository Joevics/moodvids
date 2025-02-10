
import { Card } from "@/components/ui/card";
import { Movie } from "@/types/movie";
import { Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWatchHistory } from "@/hooks/useWatchHistory";

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
  const { toast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);
  const { toggleWatch, isMovieWatched } = useWatchHistory();
  const [isWatched, setIsWatched] = useState(false);

  useEffect(() => {
    setIsWatched(isMovieWatched(movie.id));
  }, [movie.id, isMovieWatched]);

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
            <div className="flex justify-between items-center">
              <span className="text-white/90 text-sm">
                {new Date(movie.release_date).getFullYear()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:text-primary"
                onClick={handleWatch}
                disabled={toggleWatch.isPending}
              >
                {isWatched ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
