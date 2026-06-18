export type FlashcardStatus = 'learning' | 'known' | 'unknown' | 'mastered';

export interface Flashcard {
  id: string;
  word: string;
  meaning: string;
  status: FlashcardStatus;
  timesStudied: number;
  timesKnown: number;
  timesUnknown: number;
  lastReviewed?: number;
}

export interface Deck {
  id: string;
  name: string;
  originalText: string;
  cards: Flashcard[];
  createdAt: number;
  updatedAt: number;
  lastStudiedAt: number | null;
  progress: {
    totalStudied: number;
    knownCount: number;
    unknownCount: number;
    accuracy: number;
  };
}

export type StudyMode = 'word-meaning' | 'meaning-word' | 'random';

export interface Session {
  id: string;
  deckId: string;
  date: number;
  duration: number; // in seconds
  cardsStudied: number;
  knownCount: number;
  unknownCount: number;
  accuracy: number;
}
