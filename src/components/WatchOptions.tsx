
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StreamingOptions } from "@/types/movie";
import { Apple, Film, Play, ShoppingBag, Store } from "lucide-react";

interface WatchOptionsProps {
  streamingOptions?: StreamingOptions;
  title: string;
  year?: string;
}

export const WatchOptions = ({ streamingOptions, title, year }: WatchOptionsProps) => {
  // If no streaming options are available, return a fallback UI
  if (!streamingOptions || 
      (!streamingOptions.rent?.length && 
       !streamingOptions.buy?.length && 
       !streamingOptions.stream?.length)) {
    return null;
  }

  const getProviderIcon = (provider: string) => {
    const iconMap: Record<string, JSX.Element> = {
      "Netflix": <Play className="h-4 w-4 text-red-600" />,
      "Prime Video": <ShoppingBag className="h-4 w-4 text-blue-500" />,
      "Amazon Video": <ShoppingBag className="h-4 w-4 text-blue-500" />,
      "Disney+": <Play className="h-4 w-4 text-blue-700" />,
      "Apple TV": <Apple className="h-4 w-4" />,
      "HBO Max": <Film className="h-4 w-4 text-purple-600" />,
      "YouTube": <Play className="h-4 w-4 text-red-500" />,
      "Google Play Movies": <Play className="h-4 w-4 text-green-500" />,
      "Microsoft Store": <Store className="h-4 w-4 text-blue-600" />,
      "Hulu": <Play className="h-4 w-4 text-green-600" />,
    };

    return iconMap[provider] || <Play className="h-4 w-4" />;
  };
  
  const generateFallbackSearchUrl = (provider: string) => {
    const searchQuery = `${title} ${year || ''} watch on ${provider}`;
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  };

  const renderProviderList = (providers: Array<{ provider: string; url: string }>, title: string) => {
    if (!providers || providers.length === 0) return null;
    
    return (
      <div className="mt-2">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {providers.map((item, index) => (
            <a
              key={`${item.provider}-${index}`}
              href={item.url || generateFallbackSearchUrl(item.provider)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-secondary/30 hover:bg-secondary/50 transition-colors duration-200"
            >
              {getProviderIcon(item.provider)}
              {item.provider}
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="mt-8 bg-gradient-to-r from-blue-600/5 to-purple-600/5 hover:from-blue-600/10 hover:to-purple-600/10 transition-all duration-300 border-muted/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          Where to Watch
        </CardTitle>
        <CardDescription>
          Available streaming options for {title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {renderProviderList(streamingOptions.stream, "Stream")}
          {renderProviderList(streamingOptions.rent, "Rent")}
          {renderProviderList(streamingOptions.buy, "Buy")}
        </div>
      </CardContent>
    </Card>
  );
};
