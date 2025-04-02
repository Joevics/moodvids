
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTopPicks } from "@/hooks/useTopPicks";
import { getOrCreateAnonymousId } from "@/lib/anonymousUser";

interface TopPickProps {
  topPick: {
    id: string;
    user_id: string;
    movie_id: number;
    movie_title: string;
    release_year: string;
    rating: number;
    comment?: string;
    trailer_key?: string;
    genres?: string[];
    created_at: string;
  };
}

export const TopPickCard = ({ topPick }: TopPickProps) => {
  const { deleteTopPick } = useTopPicks();
  const [isOwner, setIsOwner] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  // Check if current user is the owner of this recommendation
  useState(async () => {
    const userId = await getOrCreateAnonymousId();
    setIsOwner(userId === topPick.user_id);
  });

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <Link to={`/movie/${topPick.movie_id}`} className="block">
        <div className="flex flex-col">
          {/* YouTube Trailer */}
          {topPick.trailer_key ? (
            <div className="relative pb-[56.25%] h-0 bg-muted">
              {!videoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              )}
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${topPick.trailer_key}`}
                title={topPick.movie_title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setVideoLoaded(true)}
              ></iframe>
            </div>
          ) : (
            <div className="relative pb-[56.25%] h-0 bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No trailer available</span>
            </div>
          )}
          
          <CardContent className="p-4">
            <div className="flex justify-between items-start gap-2 mb-2">
              <h3 className="text-lg font-semibold line-clamp-1">{topPick.movie_title}</h3>
              <Badge variant="outline">{topPick.release_year}</Badge>
            </div>
            
            <div className="flex items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < topPick.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            
            {topPick.comment && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                "{topPick.comment}"
              </p>
            )}
            
            {topPick.genres && topPick.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {topPick.genres.slice(0, 3).map(genre => (
                  <Badge key={genre} variant="secondary" className="text-xs">
                    {genre}
                  </Badge>
                ))}
                {topPick.genres.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{topPick.genres.length - 3}
                  </Badge>
                )}
              </div>
            )}
            
            {isOwner && (
              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteTopPick.mutateAsync(topPick.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  <span>Delete</span>
                </Button>
              </div>
            )}
          </CardContent>
        </div>
      </Link>
    </Card>
  );
};
