export interface SpotifyTrack {
    id: string;
    name: string;
    artists: Array<{
      id: string;
      name: string;
    }>;
    album: {
      id: string;
      name: string;
      images: Array<{
        url: string;
        height: number | undefined;
        width: number | undefined;
      }>;
    };
    external_urls: {
      spotify: string;
    };
    preview_url: string | null;
    duration_ms: number;
    popularity: number;
  }