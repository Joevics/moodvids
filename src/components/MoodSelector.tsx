
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mood } from "@/types/movie";
import {
  Heart,
  PartyPopper,
  Laugh,
  Tent,
  Coffee,
  Flame,
  CloudRain,
  Lightbulb,
} from "lucide-react";

interface MoodSelectorProps {
  selectedMood?: Mood;
  onSelect: (mood: Mood) => void;
}

const moods: { value: Mood; icon: React.ElementType; label: string }[] = [
  { value: "happy", icon: Laugh, label: "Happy" },
  { value: "sad", icon: CloudRain, label: "Sad" },
  { value: "excited", icon: PartyPopper, label: "Excited" },
  { value: "romantic", icon: Heart, label: "Romantic" },
  { value: "nostalgic", icon: Coffee, label: "Nostalgic" },
  { value: "adventurous", icon: Tent, label: "Adventurous" },
  { value: "relaxed", icon: Coffee, label: "Relaxed" },
  { value: "inspired", icon: Lightbulb, label: "Inspired" },
];

export const MoodSelector = ({ selectedMood, onSelect }: MoodSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto animate-fadeIn">
      {moods.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant="outline"
          className={cn(
            "h-24 flex flex-col gap-2 relative overflow-hidden transition-all duration-300",
            selectedMood === value &&
              "border-2 border-mood-" + value + " bg-mood-" + value + "/10"
          )}
          onClick={() => onSelect(value)}
        >
          <Icon className={cn("w-6 h-6", selectedMood === value && "animate-bounce")} />
          <span className="font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
};
