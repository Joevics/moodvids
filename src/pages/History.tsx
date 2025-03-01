
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { MovieCard } from "@/components/MovieCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

const History = () => {
  const { watchHistory, isLoading } = useWatchHistory();
  const { toast } = useToast();

  if (isLoading) {
    return <div className="p-4 text-center">Loading watch history...</div>;
  }

  if (!watchHistory.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No watched movies yet. Start watching to build your history!
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="text-2xl font-bold mb-4">Watch History</h1>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {watchHistory.map((item) => (
            <MovieCard
              key={item.id}
              movie={{
                id: item.movie_id,
                title: item.movie_title,
                poster_path: item.poster_path || "",
                overview: "",
                release_date: "",
                vote_average: 0,
                genres: [],
              }}
              showFullDetails={false}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default History;
