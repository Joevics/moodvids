
export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  genres: string[];
  providers?: string[];
  trailer_key?: string;
  streaming_options?: StreamingOptions;
}

export interface StreamingOptions {
  rent?: StreamingProvider[];
  buy?: StreamingProvider[];
  stream?: StreamingProvider[];
}

export interface StreamingProvider {
  provider: string;
  url: string;
  logo?: string;
}

export type Mood =
  | "happy"
  | "sad"
  | "excited"
  | "romantic"
  | "nostalgic"
  | "adventurous"
  | "relaxed"
  | "inspired";

export type Genre =
  | "action"
  | "comedy"
  | "drama"
  | "horror"
  | "sci-fi"
  | "fantasy"
  | "romance"
  | "thriller"
  | "documentary";

export type ContentType = "movie" | "tv" | "anime" | "documentary";

export type TimePeriod = "classic" | "90s" | "2000s" | "latest";

export type Language = 
  | "english"
  | "spanish"
  | "french"
  | "korean"
  | "japanese"
  | "chinese";

export type StreamingService = 
  | "netflix"
  | "disney"
  | "prime"
  | "hulu"
  | "hbo"
  | "apple";

export interface UserPreferences {
  mood?: Mood;
  genres?: Genre[];
  contentType?: ContentType;
  timePeriod?: TimePeriod;
  actor?: string;
}
