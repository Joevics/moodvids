
import { useRecommendations } from "@/hooks/useRecommendations";
import { MovieCard } from "@/components/MovieCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Movie } from "@/types/movie";

const Recommendations = () => {
  const { data: recommendations = [], isFetching, refetch, removeRecommendation } = useRecommendations();
  const { toggleWatch, isMovieWatched } = useWatchHistory();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleDelete = async (movieId: number) => {
    try {
      await removeRecommendation.mutateAsync(movieId);
    } catch (error) {
      console.error('Error removing recommendation:', error);
    }
  };

  // Get the timestamp of when recommendations were last generated
  const lastGeneratedAt = localStorage.getItem('recommendations-generated-at');
  const isNewRecommendation = (movie: any) => {
    return lastGeneratedAt && movie.generated_at && movie.generated_at > lastGeneratedAt;
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
                onDelete={() => handleDelete(movie.id)}
                isNew={isNewRecommendation(movie)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default Recommendations;
