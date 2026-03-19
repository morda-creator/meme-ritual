import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import RitualHeader from '@/components/MemeRitual/RitualHeader';
import SubmitSection from '@/components/MemeRitual/SubmitSection';
import MemeFeed from '@/components/MemeRitual/MemeFeed';
import RevealBanner from '@/components/MemeRitual/RevealBanner';
import ArchiveSection from '@/components/MemeRitual/ArchiveSection';
import PhaseSelector from '@/components/MemeRitual/PhaseSelector';
import { getDemoPhase, type Phase } from '@/lib/phases';
import { WINNER_ANNOUNCEMENT } from '@/lib/mockData';
import { useCompetition, type MemeWithVote } from '@/hooks/useCompetition';
import type { Meme } from '@/lib/mockData';

// Adapt DB memes to the MemeCard format
function toCardMeme(m: MemeWithVote, showAuthor: boolean): Meme {
  return {
    id: m.id,
    imageUrl: m.image_url,
    timestamp: new Date(m.created_at),
    aiComment: m.ai_comment || '...',
    votes: m.vote_count,
    hasVoted: m.hasVoted,
    author: showAuthor ? (m.is_ai_generated ? '🤖 MEME_RITUAL_BOT' : (m.author_name || `anon_${m.session_id?.slice(0, 6)}`)) : undefined,
    isAI: m.is_ai_generated,
  };
}

const Index = () => {
  const [demoPhase, setDemoPhase] = useState<Phase>('submission');
  const phaseInfo = getDemoPhase(demoPhase);
  const { competition, memes, loading, submitting, submitMeme, vote } = useCompetition();

  const theme = competition
    ? { title: competition.theme_title, aiIntro: competition.theme_intro }
    : { title: 'Loading...', aiIntro: 'The ritual stirs.' };

  const handleSubmit = async (file: File) => {
    try {
      await submitMeme(file);
      toast.success('Offering received.', { description: 'The AI has taken note.' });
    } catch {
      toast.error('Submission failed.', { description: 'The void rejected your offering.' });
    }
  };

  const handleVote = (id: string) => {
    vote(id);
  };

  const isReveal = phaseInfo.phase === 'reveal';
  const cardMemes = memes.map(m => toCardMeme(m, isReveal));
  const winnerId = cardMemes.length > 0
    ? cardMemes.reduce((a, b) => (a.votes > b.votes ? a : b)).id
    : undefined;

  return (
    <div className="min-h-screen bg-background relative">
      <RitualHeader phaseInfo={phaseInfo} theme={theme} />

      {loading ? (
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-20 text-center">
          <p className="font-mono text-muted-foreground text-sm animate-pulse-glow">
            Summoning the ritual...
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {phaseInfo.phase === 'preparing' && (
            <ArchiveSection />
          )}

          {phaseInfo.phase === 'submission' && (
            <div>
              <SubmitSection onSubmit={handleSubmit} />
              {submitting && (
                <div className="max-w-3xl mx-auto px-6 sm:px-10 pb-4">
                  <p className="font-mono text-xs text-primary animate-pulse-glow">
                    &gt; Processing offering...
                  </p>
                </div>
              )}
              <MemeFeed memes={cardMemes} phase="submission" />
            </div>
          )}

          {phaseInfo.phase === 'voting' && (
            <MemeFeed memes={cardMemes} phase="voting" onVote={handleVote} />
          )}

          {phaseInfo.phase === 'reveal' && (
            <div>
              <RevealBanner
                announcement={competition?.winner_announcement || WINNER_ANNOUNCEMENT}
              />
              <MemeFeed
                memes={cardMemes}
                phase="reveal"
                winnerId={winnerId}
              />
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Demo phase selector */}
      <PhaseSelector currentPhase={demoPhase} onPhaseChange={setDemoPhase} />
    </div>
  );
};

export default Index;
