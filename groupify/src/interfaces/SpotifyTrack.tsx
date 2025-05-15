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
    Votes?: number;
    Selected?: string | null;
    image?: string;
    explicit: boolean;
    queued: boolean;
    queue_at: Date | null;
    played: boolean;
    played_at: Date | null;
    blacklist: boolean;
    
}