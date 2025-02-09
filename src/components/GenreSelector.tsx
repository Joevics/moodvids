
import { Button } from "@/components/ui/button";
import { Genre } from "@/types/movie";
import { cn } from "@/lib/utils";
import {
  Film,
  Laugh,
  Theater,
  Skull,
  Rocket,
  Wand2,
  Heart,
  Siren,
  Video,
} from "lucide-react";

interface GenreSelectorProps {
  selectedGenres: Genre[];
  onSelect: (genre: Genre) => void;
}

const genres: { value: Genre; icon: React.ElementType; label: string }[] = [
  { value: "action", icon: Film, label: "Action" },
  { value: "comedy", icon: Laugh, label: "Comedy" },
  { value: "drama", icon: Theater, label: "Drama" },
  { value: "horror", icon: Skull, label: "Horror" },
  { value: "sci-fi", icon: Rocket, label: "Sci-Fi" },
  { value: "fantasy", icon: Wand2, label: "Fantasy" },
  { value: "romance", icon: Heart, label: "Romance" },
  { value: "thriller", icon: Siren, label: "Thriller" },
  { value: "documentary", icon: Video, label: "Documentary" },
];

export const GenreSelector = ({ selectedGenres, onSelect }: GenreSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl mx-auto animate-fadeIn">
      {genres.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant="outline"
          className={cn(
            "h-16 flex gap-2 relative overflow-hidden transition-all duration-300",
            selectedGenres.includes(value) &&
              "border-primary bg-primary/10"
          )}
          onClick={() => onSelect(value)}
        >
          <Icon className="w-4 h-4" />
          <span className="font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
};
