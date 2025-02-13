
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
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useRecommendations } from "@/hooks/useRecommendations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

  const recommendations = useRecommendations({
    mood: selectedMood,
    genres: selectedGenre ? [selectedGenre] : undefined,
    contentType: selectedContentType,
    timePeriod: selectedTimePeriod,
    languages: selectedLanguage ? [selectedLanguage] : undefined,
    streamingServices: selectedService ? [selectedService] : undefined,
    selectedPeople,
  });

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
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        description: "We need to know how you're feeling to give you the best recommendations.",
        variant: "destructive",
      });
      return;
    }
    
    setShowRecommendations(true);
    recommendations.refetch().catch((error) => {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to get recommendations. Please try again.",
        variant: "destructive",
      });
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
            <MoodSelector selectedMood={selectedMood} onSelect={setSelectedMood} />
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
              disabled={recommendations.isFetching}
            >
              {recommendations.isFetching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting Recommendations...
                </>
              ) : (
                "Get Recommendations"
              )}
            </Button>
          </div>

          {showRecommendations && (
            <div className="space-y-4 animate-slideUp">
              <h2 className="text-2xl font-semibold text-center">
                Here's what we recommend
              </h2>
              {recommendations.isFetching ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : recommendations.error ? (
                <div className="text-center text-red-500">
                  Error loading recommendations. Please try again.
                </div>
              ) : !recommendations.data?.length ? (
                <div className="text-center text-muted-foreground">
                  No recommendations found. Try adjusting your preferences.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {recommendations.data.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
