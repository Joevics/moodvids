
import { useRecommendations } from "@/hooks/useRecommendations";
import { MovieCard } from "@/components/MovieCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Recommendations = () => {
  const { toast } = useToast();
  const recommendations = useRecommendations({
    // We'll implement getting these from a global state management later
    mood: "happy",
    genres: ["action", "comedy"],
  });

  const handleRefresh = () => {
    recommendations.refetch();
    toast({
      title: "Refreshing recommendations",
      description: "Finding new movies based on your preferences...",
    });
  };

  if (recommendations.isLoading) {
    return <div className="p-4 text-center">Loading recommendations...</div>;
  }

  return (
    <div className="container py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Recommended for You</h1>
        <Button onClick={handleRefresh}>Refresh</Button>
      </div>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {recommendations.data?.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Recommendations;
