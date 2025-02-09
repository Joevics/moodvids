
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { User } from "lucide-react";

interface PersonSelectorProps {
  selectedPeople: string[];
  onAdd: (person: string) => void;
  onRemove: (person: string) => void;
}

export const PersonSelector = ({ selectedPeople, onAdd, onRemove }: PersonSelectorProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="space-y-4 w-full max-w-3xl mx-auto animate-fadeIn">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter actor or director name"
          className="flex-1"
        />
        <Button type="submit">Add</Button>
      </form>
      {selectedPeople.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPeople.map((person) => (
            <Button
              key={person}
              variant="secondary"
              className="flex items-center gap-2"
              onClick={() => onRemove(person)}
            >
              <User className="w-4 h-4" />
              {person}
              <span className="ml-2 text-xs">×</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
