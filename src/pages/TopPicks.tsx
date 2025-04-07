
import { useTopPicks } from "@/hooks/useTopPicks";
import { Loader2, SlidersHorizontal, AlertCircle } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimePeriodSelector } from "@/components/TimePeriodSelector";
import { GenreSelector } from "@/components/GenreSelector";
import { Genre, TimePeriod } from "@/types/movie";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { TopPickCard } from "@/components/TopPickCard";

type SortOption = "newest" | "oldest" | "rating";

const TopPicks = () => {
  const { topPicks, userTopPicks, isLoading } = useTopPicks();
  const { isInWatchlist } = useWatchlist();
  const { isMovieWatched } = useWatchHistory();
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | undefined>();
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
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
    setShowFilters(false);
  };
  
  // Apply the filterAlreadyTrackedMovies filter to remove watched/watchlisted movies
  const filteredCommunityPicks = topPicks
    .filter(filterAlreadyTrackedMovies)
    .filter(filterByGenre)
    .filter(filterByPeriod)
    .sort(sortPicks);
    
  const filteredUserPicks = userTopPicks
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Top Picks</h1>
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              size="sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter & Sort</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Sort by</h3>
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
                <h3 className="font-medium">Time Period</h3>
                <TimePeriodSelector selectedPeriod={selectedPeriod} onSelect={handlePeriodSelect} />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Genres</h3>
                <GenreSelector selectedGenres={selectedGenres} onSelect={handleGenreSelect} />
              </div>
              
              <div className="pt-2 flex justify-end">
                <Button 
                  variant="ghost" 
                  onClick={resetFilters}
                  size="sm"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Tabs defaultValue="all" className="mb-4" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">Community Picks</TabsTrigger>
          <TabsTrigger value="my">My Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : !filteredCommunityPicks.length ? (
              <div className="text-center py-8 text-muted-foreground">
                {topPicks.length > 0 
                  ? "No picks match your filters. Try adjusting your filter criteria."
                  : "No recommendations available. Be the first to recommend a movie!"}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCommunityPicks.map((topPick) => (
                  <TopPickCard key={topPick.id} topPick={topPick} />
                ))}
                
                {/* Loading indicator at the bottom */}
                <div ref={setTarget} className="py-4 flex justify-center">
                  {filteredCommunityPicks.length > 0 && activeTab === "all" && (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="my" className="mt-4">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : !filteredUserPicks.length ? (
              <div className="text-center py-8 text-muted-foreground">
                {userTopPicks.length > 0 
                  ? "No picks match your filters. Try adjusting your filter criteria."
                  : "You haven't recommended any movies yet. Rate movies to add them to your picks!"}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUserPicks.map((topPick) => (
                  <TopPickCard key={topPick.id} topPick={topPick} />
                ))}
                
                {/* Loading indicator at the bottom */}
                <div ref={setTarget} className="py-4 flex justify-center">
                  {filteredUserPicks.length > 0 && activeTab === "my" && (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TopPicks;
