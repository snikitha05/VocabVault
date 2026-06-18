import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { X, Pause, Play, Check, XCircle, RotateCcw, Undo2, Settings2 } from 'lucide-react';
import { useDecks } from '../hooks/useDecks';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import type { StudyMode, Flashcard, FlashcardStatus } from '../types';

interface SessionState {
  mode: StudyMode;
  cards: Flashcard[];
  currentIndex: number;
  stats: { known: number; unknown: number; totalStudied: number };
  sessionStartTime: number;
}

export function StudySession() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { getDeck, updateDeck, addSession } = useDecks();
  const deck = getDeck(deckId || '');

  // Persistent session state
  const [sessionState, setSessionState] = useState<SessionState>(() => {
    try {
      const stored = sessionStorage.getItem(`vocabvault_session_${deckId}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore
    }
    return {
      mode: 'word-meaning',
      cards: deck ? [...deck.cards] : [],
      currentIndex: 0,
      stats: { known: 0, unknown: 0, totalStudied: 0 },
      sessionStartTime: Date.now(),
    };
  });

  const [isFlipped, setIsFlipped] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const controls = useAnimation();

  // Save session state to sessionStorage
  useEffect(() => {
    if (sessionState.cards.length > 0) {
      sessionStorage.setItem(`vocabvault_session_${deckId}`, JSON.stringify(sessionState));
    }
  }, [sessionState, deckId]);

  const startSession = useCallback((selectedMode: StudyMode) => {
    if (!deck) return;
    let sessionCards = [...deck.cards];
    if (selectedMode === 'random') {
      sessionCards = sessionCards.sort(() => Math.random() - 0.5);
    }
    
    setSessionState({
      mode: selectedMode,
      cards: sessionCards,
      currentIndex: 0,
      stats: { known: 0, unknown: 0, totalStudied: 0 },
      sessionStartTime: Date.now(),
    });
    setIsFlipped(false);
    setIsPaused(false);
    setIsFinished(false);
    setIsAnimating(false);
  }, [deck]);

  // Check if session needs initialization only if deck changed and we have 0 cards
  useEffect(() => {
    if (deck && deck.cards.length > 0 && sessionState.cards.length === 0) {
      const timer = setTimeout(() => {
        startSession('word-meaning');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [deck, sessionState.cards.length, startSession]);

  if (!deck || deck.cards.length === 0) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold">Deck not found or empty</h2>
        <Button onClick={() => navigate('/')} className="mt-4">Return Home</Button>
      </div>
    );
  }

  const { cards, currentIndex, stats, mode } = sessionState;
  const currentCard = cards[currentIndex];

  const handleNext = async (isKnown: boolean) => {
    if (!currentCard || isAnimating) return;
    setIsAnimating(true);

    const newStats = {
      ...stats,
      known: stats.known + (isKnown ? 1 : 0),
      unknown: stats.unknown + (isKnown ? 0 : 1),
      totalStudied: stats.totalStudied + 1
    };

    await controls.start({ 
      x: isKnown ? 200 : -200, 
      opacity: 0, 
      transition: { duration: 0.2 } 
    });

    setSessionState(prev => ({ ...prev, stats: newStats }));

    const updatedCards = deck.cards.map(c => {
      if (c.id === currentCard.id) {
        const timesKnown = c.timesKnown + (isKnown ? 1 : 0);
        const timesUnknown = c.timesUnknown + (isKnown ? 0 : 1);
        const timesStudied = c.timesStudied + 1;
        const accuracyPercentage = (timesKnown / timesStudied) * 100;

        let status: FlashcardStatus;
        if (!isKnown) {
          status = 'unknown';
        } else if (timesStudied >= 3 && accuracyPercentage >= 80) {
          status = 'mastered';
        } else if (accuracyPercentage < 80) {
          status = 'unknown';
        } else {
          status = 'known';
        }

        return {
          ...c,
          timesStudied,
          timesKnown,
          timesUnknown,
          status,
          lastReviewed: Date.now()
        };
      }
      return c;
    });

    const newKnownCount = updatedCards.filter(c => c.status === 'known' || c.status === 'mastered').length;
    
    updateDeck(deck.id, {
      cards: updatedCards,
      progress: {
        totalStudied: deck.progress.totalStudied + 1,
        knownCount: newKnownCount,
        unknownCount: updatedCards.filter(c => c.status === 'unknown').length,
        accuracy: deck.progress.totalStudied + 1 > 0 ? Math.round((newKnownCount / (deck.progress.totalStudied + 1)) * 100) : 0,
      },
      lastStudiedAt: Date.now()
    });

    if (currentIndex < cards.length - 1) {
      // Important: Reset flipped state BEFORE rendering the next card
      setIsFlipped(false);
      setSessionState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
      
      // Snap card back to center, scale it down, then animate it in
      controls.set({ x: 0, opacity: 1, scale: 0.95 });
      await controls.start({ scale: 1, transition: { duration: 0.2 } });
      setIsAnimating(false);
    } else {
      setIsFinished(true);
      setIsAnimating(false);
    }
  };

  const handlePrevious = async () => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      await controls.start({ x: -100, opacity: 0, transition: { duration: 0.2 } });
      setIsFlipped(false);
      setSessionState(prev => ({ ...prev, currentIndex: prev.currentIndex - 1 }));
      
      controls.set({ x: 100, opacity: 0, scale: 0.95 });
      await controls.start({ x: 0, opacity: 1, scale: 1, transition: { duration: 0.2 } });
      setIsAnimating(false);
    }
  };

  const endSession = () => {
    const duration = Math.floor((Date.now() - sessionState.sessionStartTime) / 1000);
    const accuracy = stats.totalStudied > 0 ? Math.round((stats.known / stats.totalStudied) * 100) : 0;
    
    addSession({
      deckId: deck.id,
      date: Date.now(),
      duration,
      cardsStudied: stats.totalStudied,
      knownCount: stats.known,
      unknownCount: stats.unknown,
      accuracy
    });
    
    sessionStorage.removeItem(`vocabvault_session_${deckId}`);
    navigate(`/deck/${deck.id}`);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isAnimating) return;
    const threshold = 100;
    if (info.offset.x > threshold) {
      handleNext(true);
    } else if (info.offset.x < -threshold) {
      handleNext(false);
    } else {
      controls.start({ x: 0, opacity: 1 });
    }
  };

  if (isFinished) {
    const accuracy = stats.totalStudied > 0 ? Math.round((stats.known / stats.totalStudied) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
          <Check className="w-12 h-12" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
          <p className="text-muted-foreground text-lg">Great job studying {stats.totalStudied} cards.</p>
        </div>
        <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Accuracy</p>
            <p className="text-3xl font-bold text-primary">{accuracy}%</p>
          </div>
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Known</p>
            <p className="text-3xl font-bold text-green-500">{stats.known}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button size="lg" variant="outline" onClick={() => startSession(mode)}>
            <RotateCcw className="w-5 h-5 mr-2" /> Study Again
          </Button>
          <Button size="lg" onClick={endSession}>
            Return to Deck
          </Button>
        </div>
      </div>
    );
  }

  if (isPaused) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-6">
        <h2 className="text-3xl font-bold">Session Paused</h2>
        <div className="flex gap-4">
          <Button size="lg" onClick={() => setIsPaused(false)}>
            <Play className="w-5 h-5 mr-2" /> Resume
          </Button>
          <Button size="lg" variant="outline" onClick={endSession}>
            End Session
          </Button>
        </div>
      </div>
    );
  }

  const frontContent = mode === 'meaning-word' ? currentCard?.meaning : currentCard?.word;
  const backContent = mode === 'meaning-word' ? currentCard?.word : currentCard?.meaning;

  return (
    <div className="h-[80vh] flex flex-col pt-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 px-4">
        <button aria-label="Pause session" onClick={() => setIsPaused(true)} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50" disabled={isAnimating}>
          <Pause className="w-6 h-6" />
        </button>
        
        <div className="flex-1 px-8">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentIndex / cards.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2 font-medium">
            {currentIndex + 1} / {cards.length}
          </p>
        </div>

        <div className="flex gap-2">
          <button aria-label="Settings" onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50" disabled={isAnimating}>
            <Settings2 className="w-6 h-6" />
          </button>
          <button aria-label="End session" onClick={endSession} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50" disabled={isAnimating}>
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Card Area */}
      <div className="flex-1 relative flex items-center justify-center perspective-[1000px]">
        {currentCard && (
          <motion.div
            drag={isAnimating ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            animate={controls}
            onClick={() => {
              if (!isAnimating) setIsFlipped(!isFlipped);
            }}
            className="w-full max-w-sm aspect-[3/4] cursor-pointer"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <motion.div
              key={currentCard.id}
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
              className="relative w-full h-full"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div 
                className="absolute w-full h-full glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backface-hidden"
              >
                <span className="text-sm font-medium text-muted-foreground absolute top-6 tracking-widest uppercase">
                  {mode === 'meaning-word' ? 'Meaning' : 'Word'}
                </span>
                <h3 className="text-3xl sm:text-4xl font-bold leading-tight">{frontContent}</h3>
                <span className="text-xs text-muted-foreground absolute bottom-6 opacity-50">Tap to flip</span>
              </div>

              {/* Back */}
              <div 
                className="absolute w-full h-full glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backface-hidden bg-primary/5 border-primary/20"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <span className="text-sm font-medium text-primary/70 absolute top-6 tracking-widest uppercase">
                  {mode === 'meaning-word' ? 'Word' : 'Meaning'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-medium leading-relaxed">{backContent}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-6 pb-10 flex justify-center items-center gap-6 relative">
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label="Previous card"
          className="absolute left-6 w-12 h-12 rounded-full border border-border disabled:opacity-50"
          onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
          disabled={currentIndex === 0 || isAnimating}
        >
          <Undo2 className="w-5 h-5 text-muted-foreground" />
        </Button>

        <Button 
          variant="outline" 
          size="icon" 
          aria-label="Mark as unknown"
          className="w-16 h-16 rounded-full border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all hover:scale-110 shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-transparent disabled:hover:text-red-500"
          onClick={(e) => { e.stopPropagation(); handleNext(false); }}
          disabled={isAnimating}
        >
          <XCircle className="w-8 h-8" />
        </Button>
        <div className="text-center text-xs text-muted-foreground font-medium w-16">Swipe</div>
        <Button 
          variant="outline" 
          size="icon" 
          aria-label="Mark as known"
          className="w-16 h-16 rounded-full border-2 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-all hover:scale-110 shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-transparent disabled:hover:text-green-500"
          onClick={(e) => { e.stopPropagation(); handleNext(true); }}
          disabled={isAnimating}
        >
          <Check className="w-8 h-8" />
        </Button>
      </div>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Session Settings">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">Study Mode</label>
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant={mode === 'word-meaning' ? 'primary' : 'outline'} 
                onClick={() => { startSession('word-meaning'); setIsSettingsOpen(false); }}
              >
                Word → Meaning
              </Button>
              <Button 
                variant={mode === 'meaning-word' ? 'primary' : 'outline'} 
                onClick={() => { startSession('meaning-word'); setIsSettingsOpen(false); }}
              >
                Meaning → Word
              </Button>
              <Button 
                variant={mode === 'random' ? 'primary' : 'outline'} 
                onClick={() => { startSession('random'); setIsSettingsOpen(false); }}
              >
                Random Order
              </Button>
            </div>
          </div>
          <div className="pt-4 border-t border-border flex justify-between">
            <Button variant="danger" onClick={() => { startSession(mode); setIsSettingsOpen(false); }}>
              Restart Session
            </Button>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
