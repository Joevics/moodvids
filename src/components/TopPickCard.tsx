
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Star, Calendar, MessageSquare, ChevronDown, ChevronUp, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TopPickItem, useTopPicks } from "@/hooks/useTopPicks";
import { Skeleton } from "@/components/ui/skeleton";
import { useTMDBMovieDetails } from "@/hooks/useTMDBMovieDetails";

interface TopPickCardProps {
  topPick: TopPickItem;
}

export const TopPickCard = ({ topPick }: TopPickCardProps) => {
  const navigate = useNavigate();
  const { isUserTopPick } = useTopPicks();
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
  
  // Check if this pick was created by the current user
  const isOwnPick = isUserTopPick(topPick.user_id);
  
  return (
    <Card 
      className="overflow-hidden transition-shadow hover:shadow-lg cursor-pointer" 
      onClick={handleCardClick}
    >
      <div className="grid grid-cols-[100px,1fr] gap-3 h-auto p-3">
        {/* Movie poster */}
        <div className="relative aspect-[2/3]">
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
              <h3 className="text-base font-semibold line-clamp-2">
                {topPick.movie_title}
              </h3>
            </div>
            
            {/* Rating and year */}
            <div className="flex items-center mb-2 text-sm text-muted-foreground">
              <div className="flex items-center mr-3">
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
            
            {/* Genre line */}
            {topPick.genres && topPick.genres.length > 0 && (
              <div className="flex items-center text-xs mb-2">
                <Tag className="w-3 h-3 mr-1 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">
                  {topPick.genres.slice(0, 3).join(", ")}
                  {topPick.genres.length > 3 && "..."}
                </div>
              </div>
            )}
            
            {/* Comment section */}
            {topPick.comment && (
              <div className="mt-1">
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
