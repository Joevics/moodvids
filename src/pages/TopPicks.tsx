
import { useState } from "react";
import { useTopPicks } from "@/hooks/useTopPicks";
import { TopPickCard } from "@/components/TopPickCard";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FilterX } from "lucide-react";

const TopPicks = () => {
  const { topPicks, isLoading, filter, setFilter } = useTopPicks();
  const [uniqueYears, setUniqueYears] = useState<string[]>([]);
  const [uniqueGenres, setUniqueGenres] = useState<string[]>([]);
  
  // Extract unique years and genres from the data
  useState(() => {
    if (topPicks.length) {
      const years = Array.from(new Set(topPicks.map(pick => pick.release_year)));
      setUniqueYears(years.sort((a, b) => Number(b) - Number(a)));
      
      const genres = Array.from(
        new Set(topPicks.flatMap(pick => pick.genres || []))
      );
      setUniqueGenres(genres.sort());
    }
  });

  const handleYearChange = (year: string) => {
    setFilter(prev => ({ ...prev, year }));
  };
  
  const handleGenreChange = (genre: string) => {
    setFilter(prev => ({ ...prev, genre }));
  };
  
  const clearFilters = () => {
    setFilter({});
  };

  return (
    <div className="container py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Top Picks</h1>
      </div>
      
      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Select
            value={filter.year || ""}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {uniqueYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={filter.genre || ""}
            onValueChange={handleGenreChange}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              {uniqueGenres.map(genre => (
                <SelectItem key={genre} value={genre}>{genre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {(filter.year || filter.genre) && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={clearFilters}
              className="h-10 w-10"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-12rem)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !topPicks.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No top picks available yet. Recommend a movie from your recommendations!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topPicks.map((pick) => (
              <TopPickCard key={pick.id} topPick={pick} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default TopPicks;
