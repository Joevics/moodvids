
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Movie } from "@/types/movie";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Calendar, Clock, Star, Users, Tag, Tv } from "lucide-react";

interface MovieDetailsResponse extends Movie {
  backdrop_path: string;
  runtime: number;
  release_date: string;
  cast: Array<{ name: string; character: string }>;
  crew: Array<{ name: string; job: string }>;
}

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();

  const { data: movie, isLoading } = useQuery({
    queryKey: ["movie", id],
    queryFn: async () => {
      const [movieResponse, creditsResponse] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=en-US`),
        fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${import.meta.env.VITE_TMDB_API_KEY}`)
      ]);

      const movieData = await movieResponse.json();
      const creditsData = await creditsResponse.json();

      return {
        ...movieData,
        cast: creditsData.cast.slice(0, 10),
        crew: creditsData.crew.filter(person => 
          ["Director", "Producer", "Screenplay"].includes(person.job)
        ).slice(0, 5)
      } as MovieDetailsResponse;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return <div>Movie not found</div>;
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="relative">
        {movie.backdrop_path && (
          <div className="w-full h-[40vh] relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            <img
              src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="container py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3">
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4">{movie.title}</h1>
              
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-1" />
                  <span>{movie.vote_average.toFixed(1)}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-1" />
                  <span>{new Date(movie.release_date).getFullYear()}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-1" />
                  <span>{movie.runtime} min</span>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2 flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Genres
                </h2>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span key={genre} className="px-3 py-1 bg-primary/10 rounded-full text-sm">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-lg text-muted-foreground">{movie.overview}</p>
              </div>

              {movie.providers && movie.providers.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2 flex items-center">
                    <Tv className="w-5 h-5 mr-2" />
                    Available on
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {movie.providers.map((provider) => (
                      <span key={provider} className="px-3 py-1 bg-primary/10 rounded-full text-sm">
                        {provider}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Cast & Crew
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Cast</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {movie.cast.map((person) => (
                        <li key={person.name}>
                          {person.name} as {person.character}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Crew</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {movie.crew.map((person) => (
                        <li key={`${person.name}-${person.job}`}>
                          {person.name} - {person.job}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default MovieDetails;
