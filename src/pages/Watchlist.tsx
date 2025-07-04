
import { useWatchlist } from "@/hooks/useWatchlist";
import { MovieCard } from "@/components/MovieCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";

const Watchlist = () => {
  const { watchlist, isLoading } = useWatchlist();

  if (isLoading) {
    return <div className="p-4 text-center">Loading watchlist...</div>;
  }

  if (watchlist.length === 0) {
    return (
      <div className="container py-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Your Watchlist</h1>
        <p className="text-muted-foreground">
          You haven't added any movies to your watchlist yet.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="text-2xl font-bold mb-4">Your Watchlist</h1>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {watchlist.map((movie) => (
            <Link to={`/movie/${movie.id}`} key={movie.id} className="block transition-transform hover:scale-105">
              <MovieCard
                movie={movie}
                showFullDetails={false}
              />
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Watchlist;
