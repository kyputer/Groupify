export interface Song {
  id: string;
  name: string;
  artists: { name: string }[];
  external_urls: { spotify: string };
  image: string;
  album: {
    id: string;
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  explicit: boolean;
  preview_url: string | null;
  popularity: number;
  Votes?: number;
  Selected?: string | null;
  addedBy?: {
    id: number;
    username: string;
  };
}
