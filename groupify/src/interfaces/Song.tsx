export interface Song {
    id: string;
    name: string;
    artists: { name: string }[];
    external_urls: { spotify: string };
    image: string;
    album?: {
      images: { url: string }[];
    };
    Votes: number;
    Selected: string | null;
    duration_ms: number;
    explicit: boolean;
  }