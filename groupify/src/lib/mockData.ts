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
    }
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
    }
  },
  {
    id: '3',
    name: 'good 4 u',
    artists: [
      { name: 'Olivia Rodrigo' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/4ZtFanR9U6ndgddUvNcjcG'
    }
  },
  {
    id: '11',
    name: 'Blinding Dark',
    artists: [
      { name: 'The Weeknd' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b'
    }
  },
];

export const mockVotes: Vote[] = [
  {
    SongID: '1',
    Votes: 5
  },
  {
    SongID: '2',
    Votes: 3
  },
  {
    SongID: '3',
    Votes: 1
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
    }
  },
  {
    id: '4',
    name: 'Levitating',
    artists: [
      { name: 'Dua Lipa' },
      { name: 'DaBaby' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP'
    }
  },
  {
    id: '4',
    name: 'Levitating',
    artists: [
      { name: 'Dua Lipa' },
      { name: 'DaBaby' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP'
    }
  },
  {
    id: '4',
    name: 'Levitating',
    artists: [
      { name: 'Dua Lipa' },
      { name: 'DaBaby' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP'
    }
  },
  {
    id: '4',
    name: 'Levitating',
    artists: [
      { name: 'Dua Lipa' },
      { name: 'DaBaby' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP'
    }
  },
  {
    id: '4',
    name: 'Levitating',
    artists: [
      { name: 'Dua Lipa' },
      { name: 'DaBaby' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP'
    }
  },
  {
    id: '4',
    name: 'Levitating',
    artists: [
      { name: 'Dua Lipa' },
      { name: 'DaBaby' }
    ],
    external_urls: {
      spotify: 'https://open.spotify.com/track/39LLxExYz6ewLAcYrzQQyP'
    }
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
    }
  }
];