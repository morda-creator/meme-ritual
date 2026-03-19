import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import RitualHeader from '@/components/MemeRitual/RitualHeader';
import SubmitSection from '@/components/MemeRitual/SubmitSection';
import MemeFeed from '@/components/MemeRitual/MemeFeed';
import RevealBanner from '@/components/MemeRitual/RevealBanner';
import PhaseSelector from '@/components/MemeRitual/PhaseSelector';
import { getDemoPhase, type Phase } from '@/lib/phases';
import { MOCK_THEME, MOCK_MEMES, REVEALED_MEMES, AI_COMMENTS, WINNER_ANNOUNCEMENT } from '@/lib/mockData';
import type { Meme } from '@/lib/mockData';

const Index = () => {
  const [demoPhase, setDemoPhase] = useState<Phase>('submission');
  const phaseInfo = getDemoPhase(demoPhase);

  const [userMemes, setUserMemes] = useState<Meme[]>(MOCK_MEMES);
  const [votingMemes, setVotingMemes] = useState<Meme[]>(MOCK_MEMES);

  const handleSubmit = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const comment = AI_COMMENTS[Math.floor(Math.random() * AI_COMMENTS.length)];
    const newMeme: Meme = {
      id: Date.now().toString(),
      imageUrl: url,
      timestamp: new Date(),
      aiComment: comment,
      votes: 0,
      hasVoted: false,
    };
    setUserMemes((prev) => [newMeme, ...prev]);
  }, []);

  const handleVote = useCallback((id: string) => {
    setVotingMemes((prev) =>
      prev.map((m) =>
        m.id === id && !m.hasVoted
          ? { ...m, votes: m.votes + 1, hasVoted: true }
          : m
      )
    );
  }, []);

  // Find winner (most votes)
  const winnerId = REVEALED_MEMES.reduce((a, b) => (a.votes > b.votes ? a : b)).id;

  return (
    <div className="min-h-screen bg-background relative">
      <RitualHeader phaseInfo={phaseInfo} theme={MOCK_THEME} />

      <AnimatePresence mode="wait">
        {phaseInfo.phase === 'preparing' && (
          <div className="max-w-3xl mx-auto px-6 sm:px-10 py-20 text-center">
            <p className="font-mono text-muted-foreground text-sm animate-pulse-glow">
              The ritual has not yet begun.
            </p>
            <p className="font-mono text-xs text-muted-foreground/50 mt-2">
              Return when the time is right.
            </p>
          </div>
        )}

        {phaseInfo.phase === 'submission' && (
          <div>
            <SubmitSection onSubmit={handleSubmit} />
            <MemeFeed memes={userMemes} phase="submission" />
          </div>
        )}

        {phaseInfo.phase === 'voting' && (
          <MemeFeed memes={votingMemes} phase="voting" onVote={handleVote} />
        )}

        {phaseInfo.phase === 'reveal' && (
          <div>
            <RevealBanner announcement={WINNER_ANNOUNCEMENT} />
            <MemeFeed
              memes={REVEALED_MEMES}
              phase="reveal"
              winnerId={winnerId}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Demo phase selector */}
      <PhaseSelector currentPhase={demoPhase} onPhaseChange={setDemoPhase} />
    </div>
  );
};

export default Index;
