
import { Button } from "@/components/ui/button";
import { ContentType } from "@/types/movie";
import { cn } from "@/lib/utils";
import { Film, Tv, GanttChart, Video, Smile } from "lucide-react";

interface ContentTypeSelectorProps {
  selectedType?: ContentType;
  onSelect: (type: ContentType) => void;
}

const contentTypes: { value: ContentType; icon: React.ElementType; label: string }[] = [
  { value: "movie", icon: Film, label: "Movies" },
  { value: "tv", icon: Tv, label: "TV Series" },
  { value: "anime", icon: GanttChart, label: "Anime" },
  { value: "documentary", icon: Video, label: "Documentary" },
  { value: "cartoon", icon: Smile, label: "Cartoons" },
];

export const ContentTypeSelector = ({ selectedType, onSelect }: ContentTypeSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full max-w-3xl mx-auto animate-fadeIn">
      {contentTypes.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant="outline"
          className={cn(
            "h-16 flex flex-col gap-2 relative overflow-hidden transition-all duration-300",
            selectedType === value && "border-primary bg-primary/10"
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
