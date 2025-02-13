
import { useRecommendations } from "@/hooks/useRecommendations";
import { MovieCard } from "@/components/MovieCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useWatchlist } from "@/hooks/useWatchlist";

const Recommendations = () => {
  const { data: recommendations = [], isFetching, refetch, removeRecommendation } = useRecommendations();
  const { toggleWatch, isMovieWatched } = useWatchHistory();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleWatchToggle = async (movieId: number) => {
    await removeRecommendation.mutateAsync(movieId);
  };

  const handleWatchlistToggle = async (movie: any) => {
    try {
      await toggleWatchlist.mutateAsync({
        movie,
        isInWatchlist: isInWatchlist(movie.id)
      });
      await removeRecommendation.mutateAsync(movie.id);
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  return (
    <div className="container py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Recommended for You</h1>
      </div>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        {isFetching && !recommendations.length ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !recommendations.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No recommendations available. Try using the home page to get personalized recommendations.
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((movie) => (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
                onWatchToggle={() => handleWatchToggle(movie.id)}
                onWatchlistToggle={() => handleWatchlistToggle(movie)}
                onDelete={() => removeRecommendation.mutate(movie.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default Recommendations;
