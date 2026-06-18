import { useLocalStorage } from './useLocalStorage';
import type { Deck, Flashcard, Session } from '../types';
import { generateId } from '../utils/parser';

export function useDecks() {
  const [decks, setDecks] = useLocalStorage<Deck[]>('vocabvault_decks', []);
  const [sessions, setSessions] = useLocalStorage<Session[]>('vocabvault_sessions', []);

  const addDeck = (name: string, originalText: string, cards: Omit<Flashcard, 'id'>[]) => {
    const newDeck: Deck = {
      id: generateId(),
      name,
      originalText,
      cards: cards.map(c => ({ ...c, id: generateId() })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastStudiedAt: null,
      progress: {
        totalStudied: 0,
        knownCount: 0,
        unknownCount: 0,
        accuracy: 0,
      },
    };
    setDecks(prev => [newDeck, ...prev]);
    return newDeck;
  };

  const updateDeck = (id: string, updates: Partial<Deck>) => {
    setDecks(prev => prev.map(deck => (deck.id === id ? { ...deck, ...updates, updatedAt: Date.now() } : deck)));
  };

  const deleteDeck = (id: string) => {
    setDecks(prev => prev.filter(deck => deck.id !== id));
    // Optionally delete sessions associated with this deck
    setSessions(prev => prev.filter(session => session.deckId !== id));
  };

  const getDeck = (id: string) => decks.find(deck => deck.id === id);

  const addSession = (session: Omit<Session, 'id'>) => {
    const newSession: Session = { ...session, id: generateId() };
    setSessions(prev => [newSession, ...prev]);
    return newSession;
  };

  const getDeckSessions = (deckId: string) => sessions.filter(s => s.deckId === deckId);

  return {
    decks,
    addDeck,
    updateDeck,
    deleteDeck,
    getDeck,
    sessions,
    addSession,
    getDeckSessions,
  };
}
