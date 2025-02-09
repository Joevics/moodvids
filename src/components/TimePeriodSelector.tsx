
import { Button } from "@/components/ui/button";
import { TimePeriod } from "@/types/movie";
import { cn } from "@/lib/utils";
import { Clock4, Timer, Hourglass, History } from "lucide-react";

interface TimePeriodSelectorProps {
  selectedPeriod?: TimePeriod;
  onSelect: (period: TimePeriod) => void;
}

const periods: { value: TimePeriod; icon: React.ElementType; label: string }[] = [
  { value: "latest", icon: Clock4, label: "Latest" },
  { value: "2000s", icon: Timer, label: "2000s" },
  { value: "90s", icon: Hourglass, label: "90s" },
  { value: "classic", icon: History, label: "Classic" },
];

export const TimePeriodSelector = ({ selectedPeriod, onSelect }: TimePeriodSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto animate-fadeIn">
      {periods.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant="outline"
          className={cn(
            "h-16 flex flex-col gap-2 relative overflow-hidden transition-all duration-300",
            selectedPeriod === value && "border-primary bg-primary/10"
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
