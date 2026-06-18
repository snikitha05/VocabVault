import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDecks } from '../hooks/useDecks';
import { parseVocabularyText, type ParseResult } from '../utils/parser';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export function CreateDeck() {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  
  const { decks, addDeck } = useDecks();
  const navigate = useNavigate();

  const handlePreview = () => {
    if (!name.trim()) {
      toast.error('Please enter a deck name.');
      return;
    }
    
    if (decks.some(d => d.name.toLowerCase() === name.trim().toLowerCase())) {
      toast.error('A deck with this name already exists.');
      return;
    }

    if (!text.trim()) {
      toast.error('Please enter vocabulary content.');
      return;
    }

    const result = parseVocabularyText(text);
    
    if (result.cards.length === 0) {
      toast.error('Unable to generate flashcards. Use the format: word - meaning or word : meaning.');
      return;
    }

    setParseResult(result);
    setIsReviewOpen(true);
  };

  const handleCreate = () => {
    if (!parseResult) return;
    
    const newDeck = addDeck(name.trim(), text, parseResult.cards);
    toast.success('Deck Created Successfully');
    setIsReviewOpen(false);
    navigate(`/deck/${newDeck.id}`);
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Deck</h1>
        <p className="text-muted-foreground">Paste your vocabulary list below and we'll automatically generate flashcards.</p>
      </div>

      <div className="space-y-6 bg-card p-6 md:p-8 rounded-3xl border border-border shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium ml-1">Deck Name</label>
          <Input 
            placeholder="e.g. GRE Verbal List 1" 
            value={name}
            onChange={e => setName(e.target.value)}
            className="text-lg py-6"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-sm font-medium">Vocabulary Content</label>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
              Format: word - meaning
            </span>
          </div>
          <textarea
            className="w-full h-80 rounded-2xl border border-border bg-background p-4 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none transition-all"
            placeholder={`Examples:\n\naberration - a departure from what is normal\nbenevolent : well meaning and kind\nephemeral - lasting for a short time\n\nEnter one vocabulary word per line.`}
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={handlePreview} size="lg" className="w-full md:w-auto">
            Preview Cards <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {parseResult && (
        <Modal 
          isOpen={isReviewOpen} 
          onClose={() => setIsReviewOpen(false)}
          title={`Preview: ${name}`}
          className="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-xl border border-border">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-lg">{parseResult.cards.length} cards recognized</p>
                {parseResult.errors.length > 0 && (
                  <p className="text-sm text-red-500 font-medium">
                    {parseResult.errors.length} lines could not be parsed.
                  </p>
                )}
              </div>
            </div>

            {parseResult.errors.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                <h4 className="text-sm font-semibold text-red-500 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" /> Parsing Errors
                </h4>
                <ul className="text-sm text-red-500/80 space-y-2 font-mono">
                  {parseResult.errors.map((err, idx) => (
                    <li key={idx}>
                      Line {err.line}: "{err.text}"
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Preview</h4>
              {parseResult.cards.slice(0, 10).map((card, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-border bg-background">
                  <span className="font-semibold min-w-[120px]">{card.word}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block shrink-0" />
                  <span className="text-muted-foreground text-sm">{card.meaning}</span>
                </div>
              ))}
              {parseResult.cards.length > 10 && (
                <p className="text-center text-sm text-muted-foreground pt-2">
                  ...and {parseResult.cards.length - 10} more
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" className="w-full" onClick={() => setIsReviewOpen(false)}>
                Cancel
              </Button>
              <Button className="w-full" onClick={handleCreate}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm & Create
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
