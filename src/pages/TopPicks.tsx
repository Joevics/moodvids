
import { useTopPicks, TopPickItem } from "@/hooks/useTopPicks";
import { Loader2, Star, Calendar, MessageSquare, SlidersHorizontal, AlertCircle, ChevronDown, ChevronUp, Eye, Plus } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimePeriodSelector } from "@/components/TimePeriodSelector";
import { GenreSelector } from "@/components/GenreSelector";
import { Genre, TimePeriod } from "@/types/movie";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RecommendButton } from "@/components/RecommendButton";

interface TopPickCardProps {
  topPick: TopPickItem;
}

const TopPickCard = ({ topPick }: TopPickCardProps) => {
  const navigate = useNavigate();
  const { isUserTopPick } = useTopPicks();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const { toggleWatch, isMovieWatched } = useWatchHistory();
  const [showComment, setShowComment] = useState(false);
  
  const handleCardClick = () => {
    navigate(`/movie/${topPick.movie_id}`);
  };
  
  const toggleComment = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setShowComment(!showComment);
  };

  // Create a movie object from the top pick
  const createMovieFromTopPick = () => {
    return {
      id: topPick.movie_id,
      title: topPick.movie_title,
      overview: "",
      poster_path: topPick.poster_path || "",
      release_date: topPick.release_year ? `${topPick.release_year}-01-01` : "",
      vote_average: topPick.rating * 2,
      genres: topPick.genres || []
    };
  };
  
  // Check if this pick was created by the current user
  const isOwnPick = isUserTopPick(topPick.user_id);
  
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="grid grid-cols-1 gap-4 h-auto">
        {/* Trailer section */}
        {topPick.trailer_key ? (
          <div className="aspect-video w-full">
            <iframe 
              src={`https://www.youtube.com/embed/${topPick.trailer_key}`}
              className="w-full h-full"
              title={`${topPick.movie_title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <div className="aspect-video w-full bg-muted flex items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8" />
              <span>Loading trailer...</span>
            </div>
          </div>
        )}
        
        <div className="p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 
                className="text-base font-semibold line-clamp-2 cursor-pointer hover:text-primary transition-colors" 
                onClick={handleCardClick}
              >
                {topPick.movie_title}
              </h3>
            </div>
            
            <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  <span>{topPick.rating}/5</span>
                </div>
                
                {topPick.release_year && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{topPick.release_year}</span>
                  </div>
                )}
              </div>
              
              {/* Only show watchlist and watch buttons if not the user's own pick */}
              {!isOwnPick && (
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isMovieWatched(topPick.movie_id) ? "default" : "outline"}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const movie = createMovieFromTopPick();
                            toggleWatch.mutate({
                              movie,
                              isWatched: !isMovieWatched(topPick.movie_id)
                            });
                          }}
                          disabled={toggleWatch.isPending}
                          className="h-8 w-8 p-0"
                          size="sm"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isMovieWatched(topPick.movie_id) ? 'Remove from watched' : 'Add to watched'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isInWatchlist(topPick.movie_id) ? "default" : "outline"}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const movie = createMovieFromTopPick();
                            toggleWatchlist.mutate({
                              movie,
                              isInWatchlist: isInWatchlist(topPick.movie_id)
                            });
                          }}
                          disabled={toggleWatchlist.isPending}
                          className="h-8 w-8 p-0"
                          size="sm"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isInWatchlist(topPick.movie_id) ? 'Remove from watchlist' : 'Add to watchlist'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
            
            {topPick.comment && (
              <div className="mt-2">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleComment}
                    className="p-0 h-6 flex gap-1 items-center text-muted-foreground hover:text-foreground"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    <span className="text-sm">View comment</span>
                    {showComment ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </div>
                
                {showComment && (
                  <p className="text-sm text-muted-foreground italic mt-2">
                    "{topPick.comment}"
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

type SortOption = "newest" | "oldest" | "rating";

const TopPicks = () => {
  const { topPicks, userTopPicks, isLoading } = useTopPicks();
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | undefined>();
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  
  const filterByGenre = (pick: TopPickItem) => {
    if (selectedGenres.length === 0) return true;
    return pick.genres?.some(genre => selectedGenres.includes(genre as Genre)) || false;
  };
  
  const filterByPeriod = (pick: TopPickItem) => {
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
  
  const sortPicks = (a: TopPickItem, b: TopPickItem) => {
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
  
  const filteredCommunityPicks = topPicks
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

      <Tabs defaultValue="all" className="mb-4">
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
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TopPicks;
