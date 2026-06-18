import { Link } from 'react-router-dom';
import { BookOpen, Clock, BarChart3, ChevronRight } from 'lucide-react';
import type { Deck } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

interface DeckSummaryProps {
  deck: Deck;
}

export function DeckSummary({ deck }: DeckSummaryProps) {
  const progressPercent = deck.progress.totalStudied > 0
    ? Math.round((deck.progress.knownCount / deck.cards.length) * 100)
    : 0;

  return (
    <Link to={`/deck/${deck.id}`}>
      <Card className="hover:border-primary/50 transition-colors group cursor-pointer h-full flex flex-col glass-card">
        <CardHeader className="pb-3 flex-1">
          <CardTitle className="flex items-start justify-between group-hover:text-primary transition-colors">
            <span className="line-clamp-2 leading-tight">{deck.name}</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4 mr-2 text-accent" />
              <span>{deck.cards.length} cards</span>
            </div>
            {deck.lastStudiedAt && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                <span>Last studied: {new Date(deck.lastStudiedAt).toLocaleDateString()}</span>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium flex items-center text-muted-foreground">
                  <BarChart3 className="w-3 h-3 mr-1" /> Mastery
                </span>
                <span className="font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
