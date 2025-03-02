
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StreamingService } from "@/types/movie";
import { Film, PlayCircle } from "lucide-react";

interface StreamingSelectorProps {
  selectedServices: StreamingService[];
  onSelect: (service: StreamingService) => void;
}

const services: { value: StreamingService; label: string; icon?: JSX.Element }[] = [
  { value: "netflix", label: "Netflix", icon: <PlayCircle className="w-4 h-4" /> },
  { value: "disney", label: "Disney+", icon: <PlayCircle className="w-4 h-4" /> },
  { value: "prime", label: "Prime Video", icon: <PlayCircle className="w-4 h-4" /> },
  { value: "hulu", label: "Hulu", icon: <PlayCircle className="w-4 h-4" /> },
  { value: "hbo", label: "HBO Max", icon: <Film className="w-4 h-4" /> },
  { value: "apple", label: "Apple TV+", icon: <PlayCircle className="w-4 h-4" /> },
];

export const StreamingSelector = ({ selectedServices, onSelect }: StreamingSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl mx-auto animate-fadeIn">
      {services.map(({ value, label, icon }) => (
        <Button
          key={value}
          variant="outline"
          className={cn(
            "h-12 relative overflow-hidden transition-all duration-300",
            selectedServices.includes(value) && "border-primary bg-primary/10"
          )}
          onClick={() => onSelect(value)}
        >
          {icon || <PlayCircle className="w-4 h-4 mr-2" />}
          <span className="font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
};
