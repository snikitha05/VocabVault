import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Search, Trash2, Edit2, Plus, FileText, ArrowLeft, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDecks } from '../hooks/useDecks';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { parseVocabularyText } from '../utils/parser';

export function DeckDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDeck, updateDeck, deleteDeck, getDeckSessions } = useDecks();
  
  const deck = getDeck(id || '');
  const sessions = getDeckSessions(id || '').sort((a, b) => b.date - a.date);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOriginalTextOpen, setIsOriginalTextOpen] = useState(false);
  const [isAddWordsOpen, setIsAddWordsOpen] = useState(false);
  const [newWordsText, setNewWordsText] = useState('');
  
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [editNameText, setEditNameText] = useState('');

  const filteredCards = useMemo(() => {
    if (!deck) return [];
    return deck.cards.filter(card => 
      card.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.meaning.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [deck, searchQuery]);

  if (!deck) {
    return (
      <div className="p-10 text-center space-y-4">
        <h2 className="text-2xl font-bold">Deck Not Found</h2>
        <Button onClick={() => navigate('/')}>Return Home</Button>
      </div>
    );
  }

  const handleDelete = () => {
    deleteDeck(deck.id);
    toast.success('Deck deleted');
    navigate('/');
  };

  const handleEditName = () => {
    if (!editNameText.trim()) {
      toast.error('Deck name cannot be empty');
      return;
    }
    updateDeck(deck.id, { name: editNameText.trim() });
    toast.success('Deck renamed');
    setIsEditNameOpen(false);
  };

  const handleAddWords = () => {
    if (!newWordsText.trim()) return;
    
    const result = parseVocabularyText(newWordsText);
    if (result.cards.length === 0) {
      toast.error('Could not parse any valid cards.');
      return;
    }
    
    // Add IDs to new cards
    const newCardsWithIds = result.cards.map(c => ({
      ...c,
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
    }));

    updateDeck(deck.id, {
      cards: [...deck.cards, ...newCardsWithIds],
      originalText: deck.originalText + '\n\n' + newWordsText
    });
    
    toast.success(`Added ${result.cards.length} words`);
    setIsAddWordsOpen(false);
    setNewWordsText('');
  };

  const progressPercent = deck.cards.length > 0 
    ? Math.round((deck.progress.knownCount / deck.cards.length) * 100) 
    : 0;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <button 
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground flex items-center text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{deck.name}</h1>
            <button 
              onClick={() => { setEditNameText(deck.name); setIsEditNameOpen(true); }}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
              aria-label="Edit deck name"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> Created {new Date(deck.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> {deck.cards.length} cards</span>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={() => setIsOriginalTextOpen(true)}>
            <FileText className="w-4 h-4 mr-2" /> Original
          </Button>
          <Button 
            className="flex-1 md:flex-none" 
            onClick={() => navigate(`/study/${deck.id}`)}
          >
            <Play className="w-4 h-4 mr-2 fill-current" /> Study Deck
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-6 rounded-2xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Total Studied</p>
          <p className="text-3xl font-bold">{deck.progress.totalStudied}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Mastery</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-primary">{progressPercent}%</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Known Cards</p>
          <p className="text-3xl font-bold text-green-500">{deck.progress.knownCount}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <p className="text-sm text-muted-foreground font-medium mb-1">Needs Review</p>
          <p className="text-3xl font-bold text-orange-500">{deck.progress.unknownCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vocabulary List Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-2xl border border-border">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search words..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="secondary" onClick={() => setIsAddWordsOpen(true)} className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
              <Button aria-label="Delete deck" variant="ghost" onClick={() => setIsDeleteModalOpen(true)} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border border-border">
            {filteredCards.length > 0 ? (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {filteredCards.map((card, idx) => (
                  <div key={card.id} className="p-4 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 group">
                    <div className="flex items-center gap-4 w-full sm:w-1/3 shrink-0">
                      <span className="text-muted-foreground text-xs font-mono w-6 text-right">{idx + 1}.</span>
                      <span className="font-semibold text-lg">{card.word}</span>
                    </div>
                    <div className="flex-1 text-muted-foreground pl-10 sm:pl-0">
                      {card.meaning}
                    </div>
                    <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {card.status === 'mastered' && (
                        <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
                          Mastered
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                No words found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Session History Sidebar */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Session History</h2>
          <div className="glass-card rounded-2xl overflow-hidden border border-border max-h-[600px] overflow-y-auto">
            {sessions.length > 0 ? (
              <div className="divide-y divide-border">
                {sessions.map(session => (
                  <div key={session.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{new Date(session.date).toLocaleDateString()}</span>
                      <span className="text-xs text-muted-foreground">{session.duration}s</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{session.cardsStudied} cards</span>
                      <span className="font-semibold text-primary">{session.accuracy}% acc.</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No study sessions yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isEditNameOpen} onClose={() => setIsEditNameOpen(false)} title="Rename Deck">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Deck Name</label>
            <Input 
              value={editNameText}
              onChange={e => setEditNameText(e.target.value)}
              placeholder="Enter new deck name"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditNameOpen(false)}>Cancel</Button>
            <Button onClick={handleEditName}>Save Name</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Deck">
        <div className="space-y-4">
          <p>Are you sure you want to delete <strong>{deck.name}</strong>? This action cannot be undone and all progress will be lost.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete Deck</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isOriginalTextOpen} onClose={() => setIsOriginalTextOpen(false)} title="Original Vocabulary">
        <div className="space-y-4">
          <textarea 
            readOnly 
            className="w-full h-80 rounded-xl bg-muted p-4 text-sm font-mono border-0 focus:ring-0 resize-none"
            value={deck.originalText}
          />
          <div className="flex justify-end pt-2">
            <Button onClick={() => setIsOriginalTextOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAddWordsOpen} onClose={() => setIsAddWordsOpen(false)} title="Add New Words">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Paste more vocabulary here (word - meaning)</p>
          <textarea
            className="w-full h-60 rounded-xl border border-border bg-background p-4 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
            placeholder="lucid - expressed clearly&#10;tenacious - persistent and determined"
            value={newWordsText}
            onChange={e => setNewWordsText(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsAddWordsOpen(false)}>Cancel</Button>
            <Button onClick={handleAddWords}>Parse & Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
