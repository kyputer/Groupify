export interface Song {
    id: string;
    name: string;
    artists: { name: string }[];
    external_urls: { spotify: string };
    image: string;
  }