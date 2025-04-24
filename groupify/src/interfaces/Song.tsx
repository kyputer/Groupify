export interface SongInterface {
    id: string;
    name: string;
    artists: { name: string }[];
    external_urls: { spotify: string };
  }