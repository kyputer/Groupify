import { SongInterface } from '@/interfaces/Song';
import { Vote } from '@/interfaces/Vote';

export const mockSongs: SongInterface[] = [
  {
    id: '1',
    name: 'Blinding Lights',
    artists: [
      { name: 'The Weeknd' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b'
    },
    image: 'https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36'
  },
  {
    id: '2',
    name: 'Stay',
    artists: [
      { name: 'The Kid LAROI' },
      { name: 'Justin Bieber' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/5HCyWlXZPP0y6Gqq8TgA20'
    },
    image: 'https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36'
  },
  {
    id: '3',
    name: 'good 4 u',
    artists: [
      { name: 'Olivia Rodrigo' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/4ZtFanR9U6ndgddUvNcjcG'
    },
    image: 'https://i.scdn.co/image/ab67616d00004851a91c10fe9472d9bd89802e5a'
  },
  {
    id: '11',
    name: 'Blinding Dark',
    artists: [
      { name: 'The Weeknd' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b'
    },
    image: 'https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36'
  },
];

export const mockVotes: Vote[] = [
  {
    SongID: '5',
    Votes: 5,
    Selected: 'up'
  },
  {
    SongID: '16',
    Votes: 9,
    Selected: 'down'
  },
  {
    SongID: '17',
    Votes: 8,
    Selected: null
  },
  {
    SongID: '18',
    Votes: 4,
    Selected: null
  }
];

export const mockPlayedSongs: SongInterface[] = [
  {
    id: '4',
    name: 'Levitating',
    artists: [
      { name: 'Dua Lipa' },
      { name: 'DaBaby' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP'
    },
    image: 'https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36'
  },
  {
    id: '44',
    name: 'Levitating',
    artists: [
      { name: 'Dua Lipa' },
      { name: 'DaBaby' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP'
    },
    image: 'https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36'
  },
  {
    id: '444',
    name: 'Levitating',
    artists: [
      { name: 'Dua Lipa' },
      { name: 'DaBaby' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP'  
    },
    image: 'https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36'
  },
  {
    id: '4444',
    name: 'Levitating',
    artists: [
      { name: 'Dua Lipa' },
      { name: 'DaBaby' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP'  
    },
    image: 'https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36'
  },
  {
    id: '44444',
    name: 'Levitating',
    artists: [
      { name: 'Dua Lipa' },
      { name: 'DaBaby' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP'
    },
    image: 'https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36'
  },
  {
    id: '444444',
    name: 'Levitating',
    artists: [
      { name: 'Dua Lipa' },
      { name: 'DaBaby' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP'
    },
    image: 'https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36'
  },
  {
    id: '44444444',
    name: 'Levitating',
    artists: [
      { name: 'Dua Lipa' },
      { name: 'DaBaby' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP'
    },
    image: 'https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36'
  },
];

export const mockHotSongs: SongInterface[] = [
  {
    id: '5',
    name: 'Montero',
    artists: [
      { name: 'Lil Nas X' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/4jSS7ZcGtq5jQwQ5w7ZR5a'
    },
    image: 'https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36'
  },
  {
    id: '16',
    name: 'Montero1',
    artists: [
      { name: 'Lil Nas X' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/4jSS7ZcGtq5jQwQ5w7ZR5a'
    },
    image: 'https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36'
  },
  {
    id: '17',
    name: 'Montero2',
    artists: [
      { name: 'Lil Nas X' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/4jSS7ZcGtq5jQwQ5w7ZR5a'
    },
    image: 'https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36'
  },
  {
    id: '18',
    name: 'Montero3',
    artists: [
      { name: 'Lil Nas X' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/4jSS7ZcGtq5jQwQ5w7ZR5a'
    },
    image: 'https://i.scdn.co/image/ab67616d00001e028863bc11d2aa12b54f5aeb36'
  }
];