
import { useState } from "react";
import { MoodSelector } from "@/components/MoodSelector";
import { MovieCard } from "@/components/MovieCard";
import { Movie, Mood } from "@/types/movie";
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
  const [movies, setMovies] = useState<Movie[]>(mockMovies);
  const { toast } = useToast();

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    // Here we'll later integrate with OpenAI to get recommendations
    toast({
      title: "Mood selected",
      description: `Finding movies for when you're feeling ${mood}...`,
    });
  };

  const handleWatch = (movie: Movie) => {
    // Here we'll later integrate with database to save watch history
    console.log("Movie watched:", movie);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container py-8 space-y-8">
        <div className="text-center space-y-4 animate-fadeIn">
          <h1 className="text-4xl font-bold tracking-tight">Moodflix</h1>
          <p className="text-muted-foreground">
            Discover the perfect movie for your mood
          </p>
        </div>

        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">How are you feeling today?</h2>
            <MoodSelector selectedMood={selectedMood} onSelect={handleMoodSelect} />
          </div>

          {selectedMood && (
            <div className="space-y-4 animate-slideUp">
              <h2 className="text-2xl font-semibold text-center">
                Here's what we recommend
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
