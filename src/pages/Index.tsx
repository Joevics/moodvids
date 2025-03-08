import { useState } from "react";
import { MoodSelector } from "@/components/MoodSelector";
import { GenreSelector } from "@/components/GenreSelector";
import { ContentTypeSelector } from "@/components/ContentTypeSelector";
import { TimePeriodSelector } from "@/components/TimePeriodSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { PersonSelector } from "@/components/PersonSelector";
import { Movie, Mood, Genre, ContentType, TimePeriod, Language } from "@/types/movie";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRecommendations } from "@/hooks/useRecommendations";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
const Index = () => {
  const [selectedMood, setSelectedMood] = useState<Mood>();
  const [selectedGenre, setSelectedGenre] = useState<Genre>();
  const [selectedContentType, setSelectedContentType] = useState<ContentType>();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>();
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const recommendations = useRecommendations({
    mood: selectedMood,
    genres: selectedGenre ? [selectedGenre] : undefined,
    contentType: selectedContentType,
    timePeriod: selectedTimePeriod,
    languages: selectedLanguage ? [selectedLanguage] : undefined,
    selectedPeople
  });
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
  const handleAddPerson = (person: string) => {
    if (!selectedPeople.includes(person)) {
      setSelectedPeople(prev => [...prev, person]);
    }
  };
  const handleRemovePerson = (person: string) => {
    setSelectedPeople(prev => prev.filter(p => p !== person));
  };
  const handleAccordionChange = (value: string) => {
    setAdvancedOptionsOpen(value === "advanced");
  };

  // Get summary of selected advanced options
  const getSelectedOptionsText = () => {
    const options = [];
    if (selectedGenre) options.push(`Genre: ${selectedGenre}`);
    if (selectedContentType) options.push(`Content Type: ${selectedContentType}`);
    if (selectedTimePeriod) options.push(`Time Period: ${selectedTimePeriod}`);
    if (selectedLanguage) options.push(`Language: ${selectedLanguage}`);
    if (selectedPeople.length) options.push(`Cast/Crew: ${selectedPeople.join(', ')}`);
    return options;
  };
  const selectedOptions = getSelectedOptionsText();
  const handleGetRecommendations = () => {
    if (!selectedMood && !selectedOptions.length) {
      toast({
        title: "Please select preferences",
        description: "Select either a mood or advanced search options to get recommendations.",
        variant: "destructive"
      });
      return;
    }
    recommendations.refetch().then(() => {
      navigate('/recommendations');
    }).catch(error => {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to get recommendations. Please try again.",
        variant: "destructive"
      });
    });
  };
  return <div className="min-h-screen bg-[#1F1F1F] text-white">
      <main className="container py-8 space-y-8">
        <div className="text-center space-y-4 animate-fadeIn">
          <h1 className="text-4xl font-bold tracking-tight">MoodVids</h1>
          <p className="text-muted-foreground">Discover the perfect movies for your mood and preferences</p>
        </div>

        <section className="space-y-12">
          {/* Mood selector moved before advanced options */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">How are you feeling today?</h2>
            <MoodSelector selectedMood={selectedMood} onSelect={setSelectedMood} />
          </div>

          {/* Advanced Search moved below mood selector */}
          <Accordion type="single" collapsible className="w-full mb-8" defaultValue={advancedOptionsOpen ? "advanced" : undefined} onValueChange={handleAccordionChange}>
            <AccordionItem value="advanced" className="border-none">
              <AccordionTrigger className="text-xl font-medium text-center justify-center py-4 px-6 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-all">
                Advanced Search Options
              </AccordionTrigger>
              <AccordionContent className="pt-6">
                <div className="space-y-8">
                  <div className="relative">
                    <div className="overflow-x-auto pb-4 scroll-smooth scrollbar-none" id="advancedSearch" style={{
                    scrollBehavior: 'smooth'
                  }}>
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
                          <h3 className="text-lg font-medium mb-4 text-center">Cast & Crew</h3>
                          <PersonSelector selectedPeople={selectedPeople} onAdd={handleAddPerson} onRemove={handleRemovePerson} />
                        </div>
                      </div>
                    </div>
                    {/* Arrow buttons positioned farther outside */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -left-4 md:-left-8 flex items-center h-full">
                      <button className="bg-secondary/70 hover:bg-secondary/90 p-3 rounded-r-lg shadow-lg transition-colors duration-200" onClick={() => {
                      const element = document.getElementById('advancedSearch');
                      if (element) element.scrollLeft -= 350;
                    }}>
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 -right-4 md:-right-8 flex items-center h-full">
                      <button className="bg-secondary/70 hover:bg-secondary/90 p-3 rounded-l-lg shadow-lg transition-colors duration-200" onClick={() => {
                      const element = document.getElementById('advancedSearch');
                      if (element) element.scrollLeft += 350;
                    }}>
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Display selected advanced options */}
          {selectedOptions.length > 0 && <div className="bg-secondary/10 p-4 rounded-lg animate-fadeIn">
              <h3 className="text-lg font-medium mb-2">Selected Options:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {selectedOptions.map((option, index) => <li key={index}>{option}</li>)}
              </ul>
            </div>}

          <div className="text-center">
            <Button size="lg" onClick={handleGetRecommendations} className="bg-primary hover:bg-primary/90 text-white px-8" disabled={recommendations.isFetching}>
              {recommendations.isFetching ? <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting Recommendations...
                </> : "Get Recommendations"}
            </Button>
          </div>

        </section>
      </main>
    </div>;
};
export default Index;