
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Eye, Plus, Star, Calendar, Globe, Search } from "lucide-react";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Movie, StreamingOptions } from "@/types/movie";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WatchOptions } from "@/components/WatchOptions";

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toggleWatch, isMovieWatched } = useWatchHistory();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const [isLoading, setIsLoading] = useState(true);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [year, setYear] = useState<string>("");
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [streamingOptions, setStreamingOptions] = useState<StreamingOptions | null>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setIsLoading(true);
        const recommendations = JSON.parse(localStorage.getItem('moodflix-recommendations') || '[]');
        const foundMovie = recommendations.find((m: Movie) => m.id === Number(id));
        
        if (foundMovie) {
          setMovie(foundMovie);
          
          if (foundMovie.release_date) {
            const yearMatch = foundMovie.release_date.match(/^\d{4}/);
            setYear(yearMatch ? yearMatch[0] : "");
          }
          
          if (!foundMovie.trailer_key) {
            try {
              const response = await fetch(
                `https://api.themoviedb.org/3/movie/${id}/videos?api_key=1cf50e6248dc270629e802686245c2c8`
              );
              const data = await response.json();
              const trailer = data.results?.find(
                (video: any) => 
                  (video.type === "Trailer" || video.type === "Teaser") && 
                  video.site === "YouTube"
              );
              if (trailer) {
                setTrailerKey(trailer.key);
              }
            } catch (error) {
              console.error("Failed to fetch trailer:", error);
            }
          } else {
            setTrailerKey(foundMovie.trailer_key);
          }
        } else {
          toast.error('Movie not found');
        }
      } catch (error) {
        console.error('Error fetching movie details:', error);
        toast.error('Failed to load movie details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  const getStreamingLogo = (provider: string) => {
    const logoMap: Record<string, string> = {
      "Netflix": "https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme@master/icons/netflix.svg",
      "Disney+": "https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme@master/icons/disney.svg",
      "Prime Video": "https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme@master/icons/aws.svg",
      "Hulu": "https://seeklogo.com/images/H/hulu-logo-21DD3D9555-seeklogo.com.png",
      "HBO Max": "https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme@master/icons/haxe.svg",
      "Apple TV+": "https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme@master/icons/apple.svg"
    };

    return logoMap[provider] || null;
  };

  const generateSearchUrl = (title: string, releaseYear: string, site: string) => {
    const searchQuery = `${title} ${releaseYear} ${site}`;
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-48 bg-muted rounded" />
          <div className="grid md:grid-cols-[300px,1fr] gap-8">
            <div className="h-[450px] bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-12 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-32 bg-muted rounded" />
              <div className="h-10 bg-muted rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
        <Button onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Go back
        </Button>
      </div>
    );
  }

  const handleWatchToggle = async () => {
    try {
      await toggleWatch.mutateAsync({
        movie,
        isWatched: !isMovieWatched(movie.id)
      });
      toast.success(isMovieWatched(movie.id) ? 'Removed from watched' : 'Added to watched');
    } catch (error) {
      toast.error('Failed to update watch status');
    }
  };

  const handleWatchlistToggle = async () => {
    try {
      await toggleWatchlist.mutateAsync({
        movie,
        isInWatchlist: !isInWatchlist(movie.id)
      });
      toast.success(isInWatchlist(movie.id) ? 'Removed from watchlist' : 'Added to watchlist');
    } catch (error) {
      toast.error('Failed to update watchlist');
    }
  };

  const movieSites = [
    { name: "FZMovies", site: "fzmovies.net", description: "Popular for direct downloads" },
    { name: "9XMovies", site: "9xmovies.com", description: "Large collection of movies and series" },
    { name: "Nkiri", site: "nkiri.com", description: "Nigerian and international content" },
    { name: "FMovies", site: "fmovies.co", description: "Streaming site with minimal ads" }
  ];

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)} 
        className="mb-8 hover:bg-secondary/30 transition-all duration-300"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid md:grid-cols-[320px,1fr] gap-12">
        <div className="space-y-6">
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-xl border border-muted/20 transform hover:scale-[1.02] transition-all duration-300">
            <img
              src={`https://image.tmdb.org/t/p/original${movie.poster_path}`}
              alt={movie.title}
              className="object-cover w-full h-full"
            />
            <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm p-2 rounded-lg">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 mr-1" />
                <span className="font-bold">{movie.vote_average.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">{movie.title}</h1>
              <div className="flex items-center text-muted-foreground gap-4">
                {year && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">{year}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 mr-2" />
                  <span className="text-sm">{movie.vote_average.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <p className="text-md leading-relaxed text-muted-foreground border-l-4 border-primary/30 pl-4 py-1">{movie.overview}</p>
          </div>

          <div className="flex flex-col gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isMovieWatched(movie.id) ? "default" : "outline"}
                    onClick={handleWatchToggle}
                    disabled={toggleWatch.isPending}
                    className="w-full justify-center transition-all duration-300"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {isMovieWatched(movie.id) ? 'Watched' : 'Mark as watched'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMovieWatched(movie.id) ? 'Remove from watched' : 'Add to watched'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isInWatchlist(movie.id) ? "default" : "outline"}
                    onClick={handleWatchlistToggle}
                    disabled={toggleWatchlist.isPending}
                    className="w-full justify-center transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isInWatchlist(movie.id) ? 'In watchlist' : 'Add to watchlist'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isInWatchlist(movie.id) ? 'Remove from watchlist' : 'Add to watchlist'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {movie.providers && movie.providers.length > 0 && (
            <div className="bg-secondary/20 backdrop-blur-sm rounded-xl p-5 border border-muted/10">
              <h2 className="text-lg font-semibold mb-3 text-primary">Available on</h2>
              <div className="flex flex-wrap gap-4">
                {movie.providers.map((provider: string) => {
                  const logoUrl = getStreamingLogo(provider);
                  return logoUrl ? (
                    <div key={provider} className="flex flex-col items-center group">
                      <div className="w-12 h-12 p-2 rounded-full bg-background/50 backdrop-blur-md flex items-center justify-center border border-muted/20 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                        <img
                          src={logoUrl}
                          alt={provider}
                          className="w-8 h-8 object-contain"
                          title={provider}
                        />
                      </div>
                      <span className="text-xs mt-1 opacity-80 group-hover:opacity-100">{provider}</span>
                    </div>
                  ) : (
                    <Badge key={provider} variant="secondary" className="bg-background/50 backdrop-blur-md">
                      {provider}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {trailerKey && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Trailer</h2>
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-xl border border-muted/20">
                <iframe
                  src={`https://www.youtube.com/embed/${trailerKey}`}
                  title={`${movie.title} trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          )}

          <WatchOptions 
            streamingOptions={streamingOptions} 
            title={movie.title} 
            year={year} 
          />

          <div className="pt-4">
            <Accordion type="single" collapsible className="w-full border rounded-xl overflow-hidden shadow-lg bg-gradient-to-r from-blue-600/5 to-purple-600/5 hover:from-blue-600/10 hover:to-purple-600/10 transition-all duration-300">
              <AccordionItem value="find-movie" className="border-none">
                <AccordionTrigger className="py-5 px-5 hover:no-underline bg-gradient-to-r from-blue-600/10 to-purple-600/10 group">
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 mr-3 group-hover:animate-pulse text-primary" />
                    <span className="text-lg font-semibold">Find Movie Online</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-3">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Click on any of the links below to search for "{movie.title}" on Google along with the specific movie site.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {movieSites.map((site) => (
                        <a 
                          key={site.name}
                          href={generateSearchUrl(movie.title, year, site.site)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 rounded-lg bg-background/50 hover:bg-background/80 border border-muted/20 transition-all duration-300 hover:scale-[1.02] group"
                        >
                          <div className="bg-primary/10 p-2 rounded-full mr-3">
                            <Search className="w-4 h-4 text-primary group-hover:text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{site.name}</p>
                            <p className="text-xs text-muted-foreground">{site.description}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
