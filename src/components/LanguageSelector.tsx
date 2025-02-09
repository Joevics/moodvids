
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Language } from "@/types/movie";
import { Globe } from "lucide-react";

interface LanguageSelectorProps {
  selectedLanguages: Language[];
  onSelect: (language: Language) => void;
}

const languages: { value: Language; label: string }[] = [
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "korean", label: "Korean" },
  { value: "japanese", label: "Japanese" },
  { value: "chinese", label: "Chinese" },
];

export const LanguageSelector = ({ selectedLanguages, onSelect }: LanguageSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl mx-auto animate-fadeIn">
      {languages.map(({ value, label }) => (
        <Button
          key={value}
          variant="outline"
          className={cn(
            "h-12 relative overflow-hidden transition-all duration-300",
            selectedLanguages.includes(value) && "border-primary bg-primary/10"
          )}
          onClick={() => onSelect(value)}
        >
          <Globe className="w-4 h-4 mr-2" />
          <span className="font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
};
