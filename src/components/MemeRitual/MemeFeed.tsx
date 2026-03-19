import { motion } from 'framer-motion';
import MemeCard from './MemeCard';
import type { Meme } from '@/lib/mockData';
import type { Phase } from '@/lib/phases';

interface MemeFeedProps {
  memes: Meme[];
  phase: Phase;
  winnerId?: string;
  onVote?: (id: string) => void;
}

const MemeFeed = ({ memes, phase, winnerId, onVote }: MemeFeedProps) => {
  if (memes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-16 text-center">
        <p className="font-mono text-muted-foreground text-sm animate-pulse-glow">
          Silence. Concerning.
        </p>
      </div>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-6 sm:px-10 py-8">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-6"
      >
        &gt; {phase === 'reveal' ? 'The offerings, unmasked' : `${memes.length} offering${memes.length !== 1 ? 's' : ''} received`}
      </motion.p>

      <div className="grid gap-6">
        {memes.map((meme, i) => (
          <MemeCard
            key={meme.id}
            meme={meme}
            index={i}
            showVoting={phase === 'voting'}
            showAuthor={phase === 'reveal'}
            isWinner={meme.id === winnerId}
            onVote={onVote}
          />
        ))}
      </div>
    </section>
  );
};

export default MemeFeed;
