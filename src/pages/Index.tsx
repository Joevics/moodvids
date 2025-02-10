import { useState } from "react";
import { MoodSelector } from "@/components/MoodSelector";
import { GenreSelector } from "@/components/GenreSelector";
import { ContentTypeSelector } from "@/components/ContentTypeSelector";
import { TimePeriodSelector } from "@/components/TimePeriodSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { StreamingSelector } from "@/components/StreamingSelector";
import { PersonSelector } from "@/components/PersonSelector";
import { MovieCard } from "@/components/MovieCard";
import { Movie, Mood, Genre, ContentType, TimePeriod, Language, StreamingService } from "@/types/movie";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Temporary mock data until we integrate with OpenAI and TMDb
const mockMovies: Movie[] = [
  {
    id: 1,
    title: "Inception",
    overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    poster_path: "/8IB2e4r4oVhHnANbnm7O3Tj6tF8.jpg",
    release_date: "2010-07-16",
    vote_average: 8.4,
    genres: ["Action", "Sci-Fi"],
    providers: ["Netflix", "Amazon Prime"]
  },
  {
    id: 2,
    title: "The Shawshank Redemption",
    overview: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    poster_path: "/9O7gLzmreU0nGkIB6K3BsJbzvNv.jpg",
    release_date: "1994-09-23",
    vote_average: 8.7,
    genres: ["Drama"],
    providers: ["Netflix"]
  },
  // Add more mock movies...
];

const Index = () => {
  const [selectedMood, setSelectedMood] = useState<Mood>();
  const [selectedGenre, setSelectedGenre] = useState<Genre>();
  const [selectedContentType, setSelectedContentType] = useState<ContentType>();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>();
  const [selectedService, setSelectedService] = useState<StreamingService>();
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { toast } = useToast();

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
  };

  const handleGenreSelect = (genre: Genre) => {
    setSelectedGenre(genre);
  };

  const handleContentTypeSelect = (type: ContentType) => {
    setSelectedContentType(type);
  };

  const handleTimePeriodSelect = (period: TimePeriod) => {
    setSelectedTimePeriod(period);
  };

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

  const handleServiceSelect = (service: StreamingService) => {
    setSelectedService(service);
  };

  const handleAddPerson = (person: string) => {
    if (!selectedPeople.includes(person)) {
      setSelectedPeople((prev) => [...prev, person]);
    }
  };

  const handleRemovePerson = (person: string) => {
    setSelectedPeople((prev) => prev.filter((p) => p !== person));
  };

  const handleGetRecommendations = () => {
    setShowRecommendations(true);
    toast({
      title: "Generating recommendations",
      description: "Finding the perfect content based on your preferences...",
    });
  };

  return (
    <div className="min-h-screen bg-[#1F1F1F] text-white">
      <main className="container py-8 space-y-8">
        <div className="text-center space-y-4 animate-fadeIn">
          <h1 className="text-4xl font-bold tracking-tight">Moodflix</h1>
          <p className="text-muted-foreground">
            Discover the perfect content for your mood and preferences
          </p>
        </div>

        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">How are you feeling today?</h2>
            <MoodSelector selectedMood={selectedMood} onSelect={handleMoodSelect} />
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced">
              <AccordionTrigger className="text-xl font-medium text-center justify-center">
                Advanced Search Options
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-8">
                  <div className="relative">
                    <div className="overflow-x-auto pb-4 scroll-smooth" id="advancedSearch">
                      <div className="flex space-x-8 min-w-max px-4">
                        <div className="w-72">
                          <h3 className="text-lg font-medium mb-4 text-center">Genres</h3>
                          <GenreSelector selectedGenres={selectedGenre ? [selectedGenre] : []} onSelect={handleGenreSelect} />
                        </div>
                        <div className="w-72">
                          <h3 className="text-lg font-medium mb-4 text-center">Content Type</h3>
                          <ContentTypeSelector selectedType={selectedContentType} onSelect={handleContentTypeSelect} />
                        </div>
                        <div className="w-72">
                          <h3 className="text-lg font-medium mb-4 text-center">Time Period</h3>
                          <TimePeriodSelector selectedPeriod={selectedTimePeriod} onSelect={handleTimePeriodSelect} />
                        </div>
                        <div className="w-72">
                          <h3 className="text-lg font-medium mb-4 text-center">Language</h3>
                          <LanguageSelector selectedLanguages={selectedLanguage ? [selectedLanguage] : []} onSelect={handleLanguageSelect} />
                        </div>
                        <div className="w-72">
                          <h3 className="text-lg font-medium mb-4 text-center">Streaming Services</h3>
                          <StreamingSelector selectedServices={selectedService ? [selectedService] : []} onSelect={handleServiceSelect} />
                        </div>
                        <div className="w-72">
                          <h3 className="text-lg font-medium mb-4 text-center">Cast & Crew</h3>
                          <PersonSelector selectedPeople={selectedPeople} onAdd={handleAddPerson} onRemove={handleRemovePerson} />
                        </div>
                      </div>
                    </div>
                    <button 
                      className="absolute left-0 top-1/2 -translate-y-1/2 bg-background/80 p-2 rounded-full shadow-lg"
                      onClick={() => {
                        const element = document.getElementById('advancedSearch');
                        if (element) element.scrollLeft -= 300;
                      }}
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button 
                      className="absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 p-2 rounded-full shadow-lg"
                      onClick={() => {
                        const element = document.getElementById('advancedSearch');
                        if (element) element.scrollLeft += 300;
                      }}
                    >
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="text-center">
            <Button 
              size="lg"
              onClick={handleGetRecommendations}
              className="bg-primary hover:bg-primary/90 text-white px-8"
            >
              Get Recommendations
            </Button>
          </div>

          {showRecommendations && (
            <div className="space-y-4 animate-slideUp">
              <h2 className="text-2xl font-semibold text-center">
                Here's what we recommend
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {mockMovies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
