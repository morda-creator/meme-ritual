export interface Meme {
  id: string;
  imageUrl: string;
  timestamp: Date;
  aiComment: string;
  votes: number;
  hasVoted: boolean;
  author?: string; // only revealed after competition
  isAI?: boolean;
}

export const MOCK_THEME = {
  title: "Chat control in the EU",
  aiIntro: "Good luck explaining your memes to the algorithm. The machines are watching. They always were.",
};

export const AI_COMMENTS = [
  "Strong structure. Emotionally confusing.",
  "This meme understands something about modern life that most therapists don't.",
  "Ambitious. Possibly illegal in 3 countries.",
  "The composition says 'I've given up.' The font says 'but stylishly.'",
  "Bold. Unhinged. Necessary.",
  "This radiates the energy of someone who has stared into the void and the void blinked first.",
  "Technically a meme. Spiritually a manifesto.",
  "I've analyzed 14 million memes. This one is... unique. That's not a compliment.",
  "The raw emotion here is palpable. Also, the JPEG compression.",
  "This speaks to me on a frequency that shouldn't exist.",
];

export const MOCK_MEMES: Meme[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=600&h=400&fit=crop',
    timestamp: new Date(Date.now() - 3600000),
    aiComment: "Strong structure. Emotionally confusing.",
    votes: 12,
    hasVoted: false,
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop',
    timestamp: new Date(Date.now() - 7200000),
    aiComment: "This radiates the energy of someone who has stared into the void and the void blinked first.",
    votes: 24,
    hasVoted: true,
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=400&fit=crop',
    timestamp: new Date(Date.now() - 5400000),
    aiComment: "Ambitious. Possibly illegal in 3 countries.",
    votes: 8,
    hasVoted: false,
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910auj7?w=600&h=400&fit=crop',
    timestamp: new Date(Date.now() - 1800000),
    aiComment: "Technically a meme. Spiritually a manifesto.",
    votes: 31,
    hasVoted: false,
    isAI: true,
  },
];

export const REVEALED_MEMES: Meme[] = MOCK_MEMES.map((m, i) => ({
  ...m,
  author: m.isAI ? '🤖 MEME_RITUAL_BOT' : ['anon_42', 'vibes_dealer', 'ctrl_alt_defeat', 'pixel_prophet'][i] || 'unknown',
}));

export const WINNER_ANNOUNCEMENT = "Against all odds, this meme has won. Humanity remains undefeated. For now.";
