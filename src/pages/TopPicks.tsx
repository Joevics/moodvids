
import { useTopPicks, TopPickItem } from "@/hooks/useTopPicks";
import { Loader2, Star, Calendar, MessageSquare, SlidersHorizontal, AlertCircle, ThumbsUp, ThumbsDown, Bookmark, CheckCheck, ChevronDown, ChevronUp } from "lucide-react";
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
import { toast } from "sonner";

interface TopPickCardProps {
  topPick: TopPickItem;
}

const TopPickCard = ({ topPick }: TopPickCardProps) => {
  const navigate = useNavigate();
  const { voteOnTopPick, getUserVoteType } = useTopPicks();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { isMovieWatched, toggleWatch } = useWatchHistory();
  const userVoteType = getUserVoteType(topPick.id);
  const [expanded, setExpanded] = useState(false);
  
  // Check if the comment is long enough to need a "read more" button
  const shouldTruncate = topPick.comment && topPick.comment.length > 120;
  const isInUserWatchlist = isInWatchlist(topPick.movie_id);
  const isWatched = isMovieWatched(topPick.movie_id);

  const handleCardClick = () => {
    navigate(`/movie/${topPick.movie_id}`);
  };

  const handleVote = (voteType: 'upvote' | 'downvote') => (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    voteOnTopPick.mutate({ topPickId: topPick.id, voteType });
  };
  
  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    const movieObject = {
      id: topPick.movie_id,
      title: topPick.movie_title,
      release_date: topPick.release_year ? `${topPick.release_year}-01-01` : "",
      poster_path: null,
      genres: topPick.genres?.map(genre => ({ id: 0, name: genre })) || []
    };
    
    toggleWatchlist.mutate({ 
      movie: movieObject, 
      isInWatchlist: isInUserWatchlist 
    });
  };
  
  const handleWatchedToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    const movieObject = {
      id: topPick.movie_id,
      title: topPick.movie_title,
      release_date: topPick.release_year ? `${topPick.release_year}-01-01` : "",
      poster_path: null,
      genres: topPick.genres?.map(genre => ({ id: 0, name: genre })) || []
    };
    
    toggleWatch.mutate({ movie: movieObject, isWatched });
  };
  
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setExpanded(!expanded);
  };
  
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
              
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant={userVoteType === 'upvote' ? 'default' : 'ghost'}
                  onClick={handleVote('upvote')}
                  className={cn(
                    "h-8 w-8 rounded-full", 
                    userVoteType === 'upvote' ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-green-100'
                  )}
                  disabled={voteOnTopPick.isPending}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="sr-only">Upvote</span>
                </Button>
                <span className="text-sm font-medium">{topPick.upvotes}</span>
                
                <Button
                  size="icon"
                  variant={userVoteType === 'downvote' ? 'default' : 'ghost'}
                  onClick={handleVote('downvote')}
                  className={cn(
                    "h-8 w-8 rounded-full ml-1", 
                    userVoteType === 'downvote' ? 'bg-red-500 hover:bg-red-600' : 'hover:bg-red-100'
                  )}
                  disabled={voteOnTopPick.isPending}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span className="sr-only">Downvote</span>
                </Button>
                <span className="text-sm font-medium">{topPick.downvotes}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-2 text-sm text-muted-foreground">
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
            
            {topPick.comment && (
              <div className="mt-2">
                <div className="flex items-center mb-1">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Comment:</span>
                </div>
                <p className={cn(
                  "text-sm text-muted-foreground italic", 
                  !expanded && shouldTruncate && "line-clamp-3"
                )}>
                  "{topPick.comment}"
                </p>
                
                {shouldTruncate && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleExpanded}
                    className="mt-1 p-0 h-6 text-xs flex gap-1 items-center text-muted-foreground hover:text-foreground"
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        <span>Show less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        <span>Read more</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
            
            <div className="mt-3 flex gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={handleWatchlistToggle}
                className="h-8 w-8 rounded-full"
                title={isInUserWatchlist ? "Remove from watchlist" : "Add to watchlist"}
              >
                <Bookmark className="h-4 w-4" fill={isInUserWatchlist ? "currentColor" : "none"} />
                <span className="sr-only">{isInUserWatchlist ? "Remove from watchlist" : "Add to watchlist"}</span>
              </Button>
              
              <Button
                size="icon"
                variant="outline"
                onClick={handleWatchedToggle}
                className="h-8 w-8 rounded-full"
                title={isWatched ? "Mark as unwatched" : "Mark as watched"}
              >
                <CheckCheck className="h-4 w-4" stroke={isWatched ? "green" : "currentColor"} strokeWidth={isWatched ? 3 : 2} />
                <span className="sr-only">{isWatched ? "Mark as unwatched" : "Mark as watched"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

type SortOption = "newest" | "oldest" | "rating" | "most_upvoted";

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
      case "most_upvoted":
        return b.upvotes - a.upvotes;
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
                  <ToggleGroupItem value="most_upvoted">Most Upvoted</ToggleGroupItem>
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
