
import { useRecommendations } from "@/hooks/useRecommendations";
import { MovieCard } from "@/components/MovieCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

const Recommendations = () => {
  const recommendations = useRecommendations({
    mood: "happy", // Default mood
  });

  return (
    <div className="container py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Recommended for You</h1>
      </div>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        {recommendations.isFetching && !recommendations.data ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : recommendations.error ? (
          <div className="text-center text-red-500 py-8">
            Error loading recommendations. Please try again.
          </div>
        ) : !recommendations.data?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No recommendations available. Try using the home page to get personalized recommendations.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {recommendations.data.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default Recommendations;
