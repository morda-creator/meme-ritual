import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Bot, Zap } from 'lucide-react';
import type { Meme } from '@/lib/mockData';

interface MemeCardProps {
  meme: Meme;
  index: number;
  showVoting: boolean;
  showAuthor: boolean;
  isWinner?: boolean;
  onVote?: (id: string) => void;
}

const BOT_REVEAL_LINES = [
  "IDENTITY COMPROMISED. I was the machine all along.",
  "Surprise. Flesh was never involved.",
  "You voted for a robot. How does that feel?",
  "Plot twist: pixels, not people.",
  "The call was coming from inside the GPU.",
  "I don't even have hands and I still made this.",
  "Beep boop. Your taste in memes is... noted.",
  "No human was harmed in the making of this meme.",
];

const MemeCard = ({ meme, index, showVoting, showAuthor, isWinner, onVote }: MemeCardProps) => {
  const timeAgo = getTimeAgo(meme.timestamp);
  const [unmasked, setUnmasked] = useState(false);
  const [revealLine] = useState(() =>
    BOT_REVEAL_LINES[Math.floor(Math.random() * BOT_REVEAL_LINES.length)]
  );

  // Stagger the unmasking for bot memes in reveal phase
  useEffect(() => {
    if (showAuthor && meme.isAI) {
      const timer = setTimeout(() => setUnmasked(true), 1200 + index * 400);
      return () => clearTimeout(timer);
    }
  }, [showAuthor, meme.isAI, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`bg-card border rounded-lg overflow-hidden ${
        isWinner ? 'border-primary box-glow' : 'border-border'
      } ${showAuthor && meme.isAI && unmasked ? 'ring-1 ring-accent/40' : ''}`}
    >
      {isWinner && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
          <span className="font-mono text-xs text-primary text-glow uppercase tracking-widest">
            ▲ Winner
          </span>
        </div>
      )}

      {/* Bot unmasking banner */}
      <AnimatePresence>
        {showAuthor && meme.isAI && unmasked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-accent/10 border-b border-accent/20 overflow-hidden"
          >
            <div className="px-4 py-2.5 flex items-start gap-2.5">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Bot className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              </motion.div>
              <div className="min-w-0">
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="font-mono text-xs text-accent uppercase tracking-widest flex items-center gap-1.5"
                >
                  <Zap className="w-3 h-3" />
                  BOT DETECTED
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="font-mono text-xs text-foreground/60 italic mt-1 leading-relaxed"
                >
                  "{revealLine}"
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image */}
      <div className="relative bg-secondary overflow-hidden">
        <img
          src={meme.imageUrl}
          alt="Meme submission"
          className="w-full h-auto"
          loading="lazy"
        />
        <div className="absolute inset-0 scanline pointer-events-none opacity-20" />

        {/* Glitch overlay on unmask */}
        <AnimatePresence>
          {showAuthor && meme.isAI && unmasked && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-accent/20 mix-blend-overlay pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* AI Comment */}
        <div className="flex gap-2">
          <span className="font-mono text-xs text-primary shrink-0">&gt;</span>
          <p className="font-mono text-sm text-foreground/80 italic leading-relaxed">
            {meme.aiComment}
          </p>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">{timeAgo}</span>

          {showAuthor && meme.author && (
            <span className={`font-mono text-xs transition-all duration-500 ${
              meme.isAI && unmasked ? 'text-accent' : 'text-muted-foreground'
            }`}>
              {meme.isAI && unmasked ? (
                <span className="flex items-center gap-1.5">
                  <span className="line-through opacity-60">{meme.author}</span>
                  <span className="text-accent font-bold">→ 🤖 BOT</span>
                </span>
              ) : (
                meme.author
              )}
            </span>
          )}

          {showVoting && (
            <button
              onClick={() => onVote?.(meme.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs transition-all ${
                meme.hasVoted
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-secondary text-muted-foreground border border-border hover:border-primary/40 hover:text-primary'
              }`}
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>{meme.votes}</span>
            </button>
          )}

          {!showVoting && !showAuthor && (
            <span className="font-mono text-xs text-muted-foreground">
              #{String(index + 1).padStart(3, '0')}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export default MemeCard;
