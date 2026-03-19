import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import type { Meme } from '@/lib/mockData';

interface MemeCardProps {
  meme: Meme;
  index: number;
  showVoting: boolean;
  showAuthor: boolean;
  isWinner?: boolean;
  onVote?: (id: string) => void;
}

const MemeCard = ({ meme, index, showVoting, showAuthor, isWinner, onVote }: MemeCardProps) => {
  const timeAgo = getTimeAgo(meme.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`bg-card border rounded-lg overflow-hidden ${
        isWinner ? 'border-primary box-glow' : 'border-border'
      }`}
    >
      {isWinner && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
          <span className="font-mono text-xs text-primary text-glow uppercase tracking-widest">
            ▲ Winner
          </span>
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
        <img
          src={meme.imageUrl}
          alt="Meme submission"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 scanline pointer-events-none opacity-20" />
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
            <span className={`font-mono text-xs ${meme.isAI ? 'text-accent text-glow-accent' : 'text-muted-foreground'}`}>
              {meme.author}
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
