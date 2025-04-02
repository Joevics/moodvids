
import { useTopPicks, TopPickItem } from "@/hooks/useTopPicks";
import { MovieCard } from "@/components/MovieCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Star, Calendar, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Movie } from "@/types/movie";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TopPickCard = ({ topPick }: { topPick: TopPickItem }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Create a movie object from the top pick data
  const movie: Movie = {
    id: topPick.movie_id,
    title: topPick.movie_title,
    overview: "",
    poster_path: "",
    release_date: topPick.release_year,
    vote_average: topPick.rating,
    genres: topPick.genres || [],
    trailer_key: topPick.trailer_key,
  };
  
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="grid grid-cols-[120px,1fr] gap-4 h-auto min-h-[180px]">
        <div className="relative h-full">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className={cn(
              "object-cover w-full h-full",
              !imageLoaded && "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              // Use a placeholder if image fails to load
              e.currentTarget.src = "/placeholder.svg";
              setImageLoaded(true);
            }}
          />
        </div>
        
        <div className="p-3 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-base font-semibold line-clamp-2">{movie.title}</h3>
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
                <p className="text-sm text-muted-foreground line-clamp-3 italic">
                  "{topPick.comment}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const TopPicks = () => {
  const { topPicks, userTopPicks, isLoading } = useTopPicks();

  return (
    <div className="container py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Top Picks</h1>
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
            ) : !topPicks.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No recommendations available. Be the first to recommend a movie!
              </div>
            ) : (
              <div className="space-y-4">
                {topPicks.map((topPick) => (
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
            ) : !userTopPicks.length ? (
              <div className="text-center py-8 text-muted-foreground">
                You haven't recommended any movies yet. Rate movies to add them to your picks!
              </div>
            ) : (
              <div className="space-y-4">
                {userTopPicks.map((topPick) => (
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
