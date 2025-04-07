
import { useTopPicks } from "@/hooks/useTopPicks";
import { Loader2, SlidersHorizontal, AlertCircle } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TimePeriodSelector } from "@/components/TimePeriodSelector";
import { GenreSelector } from "@/components/GenreSelector";
import { Genre, TimePeriod } from "@/types/movie";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { TopPickCard } from "@/components/TopPickCard";

type SortOption = "newest" | "oldest" | "rating";

const TopPicks = () => {
  const { topPicks, isLoading } = useTopPicks();
  const { isInWatchlist } = useWatchlist();
  const { isMovieWatched } = useWatchHistory();
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | undefined>();
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  
  // Setup infinite scroll
  const { setTarget } = useInfiniteScroll({
    threshold: 0.8,
    enabled: !isLoading
  });
  
  // Filter function to remove movies that are in watchlist or watch history
  const filterAlreadyTrackedMovies = (pick: { movie_id: number }) => {
    // Hide movies that are already in watchlist or watched
    if (isInWatchlist(pick.movie_id) || isMovieWatched(pick.movie_id)) {
      return false;
    }
    return true;
  };
  
  const filterByGenre = (pick: { genres?: string[] }) => {
    if (selectedGenres.length === 0) return true;
    return pick.genres?.some(genre => selectedGenres.includes(genre as Genre)) || false;
  };
  
  const filterByPeriod = (pick: { release_year: string }) => {
    if (!selectedPeriod) return true;
    
    const year = parseInt(pick.release_year);
    if (isNaN(year)) return false;
    
    switch (selectedPeriod) {
      case "latest":
        return year >= 2020;
      case "2000s":
        return year >= 2000 && year < 2020;
      case "90s":
        return year >= 1990 && year < 2000;
      case "classic":
        return year < 1990;
      default:
        return true;
    }
  };
  
  const sortPicks = (a: { created_at: string; rating: number }, b: { created_at: string; rating: number }) => {
    switch (sortOption) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "rating":
        return b.rating - a.rating;
      default:
        return 0;
    }
  };
  
  const resetFilters = () => {
    setSelectedGenres([]);
    setSelectedPeriod(undefined);
    setSortOption("newest");
  };
  
  // Apply filters to all top picks
  const filteredTopPicks = topPicks
    .filter(filterAlreadyTrackedMovies)
    .filter(filterByGenre)
    .filter(filterByPeriod)
    .sort(sortPicks);

  const handleGenreSelect = (genre: Genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handlePeriodSelect = (period: TimePeriod) => {
    setSelectedPeriod(prev => prev === period ? undefined : period);
  };

  return (
    <div className="container py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Top Picks</h1>
      </div>

      {/* Static Filter Section */}
      <div className="mb-6 bg-background border rounded-lg p-4 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-lg">Filter</h3>
            <button 
              onClick={resetFilters}
              className="text-sm text-primary hover:underline"
            >
              Reset All
            </button>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Sort by</h4>
            <ToggleGroup 
              type="single" 
              value={sortOption}
              onValueChange={(value) => value && setSortOption(value as SortOption)}
              className="justify-start"
              size="sm"
              variant="outline"
            >
              <ToggleGroupItem value="newest">Newest</ToggleGroupItem>
              <ToggleGroupItem value="oldest">Oldest</ToggleGroupItem>
              <ToggleGroupItem value="rating">Highest Rated</ToggleGroupItem>
            </ToggleGroup>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Time Period</h4>
            <TimePeriodSelector selectedPeriod={selectedPeriod} onSelect={handlePeriodSelect} />
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Genres</h4>
            <GenreSelector selectedGenres={selectedGenres} onSelect={handleGenreSelect} />
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-24rem)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !filteredTopPicks.length ? (
          <div className="text-center py-8 text-muted-foreground">
            {topPicks.length > 0 
              ? "No picks match your filters. Try adjusting your filter criteria."
              : "No recommendations available. Be the first to recommend a movie!"}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTopPicks.map((topPick) => (
              <TopPickCard key={topPick.id} topPick={topPick} />
            ))}
            
            {/* Loading indicator at the bottom */}
            <div ref={setTarget} className="py-4 flex justify-center">
              {filteredTopPicks.length > 0 && (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default TopPicks;
