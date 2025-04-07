
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Star, Calendar, MessageSquare, ChevronDown, ChevronUp, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TopPickItem, useTopPicks } from "@/hooks/useTopPicks";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTMDBMovieDetails } from "@/hooks/useTMDBMovieDetails";
import { Skeleton } from "@/components/ui/skeleton";

interface TopPickCardProps {
  topPick: TopPickItem;
}

export const TopPickCard = ({ topPick }: TopPickCardProps) => {
  const navigate = useNavigate();
  const { isUserTopPick } = useTopPicks();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const { toggleWatch, isMovieWatched } = useWatchHistory();
  const [showComment, setShowComment] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Fetch the movie details from TMDB
  const { data: movieDetails, isLoading: isLoadingDetails } = useTMDBMovieDetails(topPick.movie_id);
  
  const handleCardClick = () => {
    navigate(`/movie/${topPick.movie_id}`);
  };
  
  const toggleComment = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setShowComment(!showComment);
  };

  // Create a movie object from the top pick
  const createMovieFromTopPick = () => {
    // Use the TMDB details if available, otherwise use the basic info from top pick
    if (movieDetails) {
      return movieDetails;
    }
    
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
      <div className="grid grid-cols-[100px,1fr] gap-3 h-auto p-3">
        {/* Movie poster */}
        <div 
          className="relative aspect-[2/3] cursor-pointer" 
          onClick={handleCardClick}
        >
          {(!imageLoaded || isLoadingDetails) && (
            <Skeleton className="absolute inset-0 w-full h-full" />
          )}
          {(topPick.poster_path || movieDetails?.poster_path) ? (
            <img
              src={`https://image.tmdb.org/t/p/w200${topPick.poster_path || movieDetails?.poster_path}`}
              alt={topPick.movie_title}
              className={cn(
                "w-full h-full object-cover rounded-sm",
                !imageLoaded && "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs text-center p-2">
              No poster available
            </div>
          )}
        </div>
        
        <div className="flex flex-col justify-between">
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
