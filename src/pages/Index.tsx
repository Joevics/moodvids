
import { useState } from "react";
import { MoodSelector } from "@/components/MoodSelector";
import { GenreSelector } from "@/components/GenreSelector";
import { ContentTypeSelector } from "@/components/ContentTypeSelector";
import { TimePeriodSelector } from "@/components/TimePeriodSelector";
import { MovieCard } from "@/components/MovieCard";
import { Movie, Mood, Genre, ContentType, TimePeriod } from "@/types/movie";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<ContentType>();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>();
  const [movies, setMovies] = useState<Movie[]>(mockMovies);
  const { toast } = useToast();

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    toast({
      title: "Mood selected",
      description: `Finding content for when you're feeling ${mood}...`,
    });
  };

  const handleGenreSelect = (genre: Genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const handleContentTypeSelect = (type: ContentType) => {
    setSelectedContentType(type);
    toast({
      title: "Content type selected",
      description: `Looking for ${type} content...`,
    });
  };

  const handleTimePeriodSelect = (period: TimePeriod) => {
    setSelectedTimePeriod(period);
    toast({
      title: "Time period selected",
      description: `Finding content from the ${period}...`,
    });
  };

  const handleWatch = (movie: Movie) => {
    // Here we'll later integrate with database to save watch history
    console.log("Movie watched:", movie);
  };

  return (
    <div className="min-h-screen bg-[#F1F0FB] text-foreground">
      <main className="container py-8 space-y-8">
        <div className="text-center space-y-4 animate-fadeIn">
          <h1 className="text-4xl font-bold tracking-tight">Moodflix</h1>
          <p className="text-muted-foreground">
            Discover the perfect content for your mood and preferences
          </p>
        </div>

        <section className="space-y-12">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">How are you feeling today?</h2>
              <MoodSelector selectedMood={selectedMood} onSelect={handleMoodSelect} />
            </div>

            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">What genres do you enjoy?</h2>
              <GenreSelector selectedGenres={selectedGenres} onSelect={handleGenreSelect} />
            </div>

            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">What type of content?</h2>
              <ContentTypeSelector
                selectedType={selectedContentType}
                onSelect={handleContentTypeSelect}
              />
            </div>

            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">From which era?</h2>
              <TimePeriodSelector
                selectedPeriod={selectedTimePeriod}
                onSelect={handleTimePeriodSelect}
              />
            </div>
          </div>

          {(selectedMood || selectedGenres.length > 0 || selectedContentType || selectedTimePeriod) && (
            <div className="space-y-4 animate-slideUp">
              <h2 className="text-2xl font-semibold text-center">
                Here's what we recommend
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} onWatch={handleWatch} />
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
