
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";
import { Movie } from "@/types/movie";
import { useTopPicks } from "@/hooks/useTopPicks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RatingStarProps {
  filled: boolean;
  onClick: () => void;
  onHover: () => void;
}

const RatingStar = ({ filled, onClick, onHover }: RatingStarProps) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-8 h-8 cursor-pointer text-yellow-400 hover:scale-110 transition-transform duration-200"
    onClick={onClick}
    onMouseEnter={onHover}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

interface RecommendButtonProps {
  movie: Movie;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
}

export const RecommendButton = ({ movie, className, size = "sm", variant = "outline" }: RecommendButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const { addTopPick, isMovieInTopPicks } = useTopPicks();
  
  const isRecommended = isMovieInTopPicks(movie.id);

  const handleRecommend = () => {
    if (isRecommended) {
      toast.info("You've already recommended this movie");
      return;
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      // Make sure we're passing the movie with the trailer key if available
      const movieWithTrailer = {
        ...movie,
        // If the movie has a trailer_key, it will be used
        // If not, the addTopPick function will fetch it
      };
      
      await addTopPick.mutateAsync({
        movie: movieWithTrailer,
        rating,
        comment: comment.trim() || undefined
      });
      
      setIsDialogOpen(false);
      setRating(0);
      setComment("");
    } catch (error) {
      console.error("Error adding recommendation:", error);
    }
  };

  return (
    <>
      <Button
        variant={isRecommended ? "default" : variant}
        size={size}
        onClick={handleRecommend}
        className={cn(className, "transition-all duration-300")}
        disabled={addTopPick.isPending}
      >
        <ThumbsUp className="w-4 h-4" />
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recommend "{movie.title}"</DialogTitle>
            <DialogDescription>
              Share your thoughts about this movie and rate it to recommend it to others.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <RatingStar
                    key={star}
                    filled={hoveredRating ? star <= hoveredRating : star <= rating}
                    onClick={() => setRating(star)}
                    onHover={() => setHoveredRating(star)}
                  />
                ))}
              </div>
              <div 
                className="text-sm text-muted-foreground" 
                onMouseLeave={() => setHoveredRating(0)}
              >
                {hoveredRating === 1 && "Poor"}
                {hoveredRating === 2 && "Fair"}
                {hoveredRating === 3 && "Good"}
                {hoveredRating === 4 && "Very Good"}
                {hoveredRating === 5 && "Excellent"}
                {!hoveredRating && rating === 1 && "Poor"}
                {!hoveredRating && rating === 2 && "Fair"}
                {!hoveredRating && rating === 3 && "Good"}
                {!hoveredRating && rating === 4 && "Very Good"}
                {!hoveredRating && rating === 5 && "Excellent"}
                {!hoveredRating && !rating && "Select a rating"}
              </div>
              
              <Textarea
                placeholder="Share why you recommend this movie (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={rating === 0 || addTopPick.isPending}
            >
              {addTopPick.isPending ? "Recommending..." : "Recommend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
