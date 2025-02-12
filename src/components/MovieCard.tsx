
import { Card } from "@/components/ui/card";
import { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Eye, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { toast } = useToast();
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
            <div className="space-y-2">
              {movie.providers && movie.providers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <p className="text-white text-sm">
                    Available on: {movie.providers.join(', ')}
                  </p>
                </div>
              )}
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-primary"
                  onClick={handleWatch}
                  disabled={toggleWatch.isPending}
                >
                  {toggleWatch.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      {isWatched ? "Seen" : "Mark as Seen"}
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-primary"
                  onClick={handleWatchlist}
                  disabled={toggleWatchlist.isPending}
                >
                  {toggleWatchlist.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      {inWatchlist ? "In Watchlist" : "+ Watchlist"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
