import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Brain, Activity } from 'lucide-react';
import { useDecks } from '../hooks/useDecks';
import { Button } from '../components/ui/Button';
import { DeckSummary } from '../components/DeckSummary';
import { motion } from 'framer-motion';

export function Home() {
  const { decks, sessions } = useDecks();
  const navigate = useNavigate();

  const totalDecks = decks.length;
  const totalWords = decks.reduce((acc, deck) => acc + deck.cards.length, 0);
  const totalSessions = sessions.length;
  
  // Calculate global progress
  const totalStudied = decks.reduce((acc, deck) => acc + deck.progress.totalStudied, 0);
  const totalKnown = decks.reduce((acc, deck) => acc + deck.progress.knownCount, 0);
  const globalProgress = totalWords > 0 && totalStudied > 0 
    ? Math.round((totalKnown / totalWords) * 100) 
    : 0;

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">Welcome Back! <span className="inline-block animate-bounce-slow">👋</span></h1>
          <p className="text-muted-foreground text-lg">Ready to master some new vocabulary today?</p>
        </div>
        <Button onClick={() => navigate('/create')} size="lg" className="shrink-0 group">
          <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
          Create Deck
        </Button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Decks" value={totalDecks} icon={<BookOpen className="text-blue-500" />} />
        <StatCard title="Total Words" value={totalWords} icon={<BookOpen className="text-purple-500" />} />
        <StatCard title="Study Sessions" value={totalSessions} icon={<Activity className="text-green-500" />} />
        <StatCard 
          title="Mastery" 
          value={`${globalProgress}%`} 
          icon={<Brain className="text-orange-500" />} 
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Your Decks</h2>
        </div>
        
        {decks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-3xl glass"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No decks created yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Create your first vocabulary deck by pasting a list of words and their meanings.
            </p>
            <Button onClick={() => navigate('/create')}>
              Create your first deck
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck, idx) => (
              <motion.div
                key={deck.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <DeckSummary deck={deck} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="glass-card p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="p-2 bg-muted rounded-lg">{icon}</div>
      </div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
