import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import RitualHeader from '@/components/MemeRitual/RitualHeader';
import SubmitSection from '@/components/MemeRitual/SubmitSection';
import MemeFeed from '@/components/MemeRitual/MemeFeed';
import RevealBanner from '@/components/MemeRitual/RevealBanner';
import ArchiveSection from '@/components/MemeRitual/ArchiveSection';
import PhaseSelector from '@/components/MemeRitual/PhaseSelector';
import GeneratingOverlay from '@/components/MemeRitual/GeneratingOverlay';
import { getDemoPhase, phaseInfoFromStatus, type Phase } from '@/lib/phases';
import { WINNER_ANNOUNCEMENT } from '@/lib/mockData';
import { useCompetition, type MemeWithVote } from '@/hooks/useCompetition';
import { useDemo } from '@/hooks/useDemo';
import type { Meme } from '@/lib/mockData';

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
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';

  const [demoPhase, setDemoPhase] = useState<Phase>('submission');
  const { competition, memes, loading, submitting, submitMeme, vote } = useCompetition();
  const { demoTheme, demoMemes, generating, generateDemo, demoVote } = useDemo();

  const phaseInfo = useMemo(() => {
    if (isDemo) return getDemoPhase(demoPhase);
    if (!competition) return phaseInfoFromStatus('preparing');
    return phaseInfoFromStatus(competition.status);
  }, [isDemo, demoPhase, competition]);

  // Use demo data when in demo mode and demo content has been generated
  const activeMemes = isDemo && demoMemes.length > 0 ? demoMemes : memes;
  const theme = isDemo && demoTheme
    ? { title: demoTheme.title, aiIntro: demoTheme.intro }
    : competition
      ? { title: competition.theme_title, aiIntro: competition.theme_intro }
      : { title: 'The next ritual begins Friday at 09:00', aiIntro: 'Patience. The altar is being prepared.' };

  const handleSubmit = async (file: File) => {
    try {
      await submitMeme(file);
      toast.success('Offering received.', { description: 'The AI has taken note.' });
    } catch {
      toast.error('Submission failed.', { description: 'The void rejected your offering.' });
    }
  };

  const handleVote = (id: string) => {
    if (isDemo) {
      demoVote(id);
    } else {
      vote(id);
    }
  };

  const handleGenerate = async () => {
    try {
      await generateDemo();
      toast.success('Ritual generated.', { description: 'Demo content ready.' });
    } catch {
      toast.error('Generation failed.', { description: 'The AI refused to cooperate.' });
    }
  };

  const isReveal = phaseInfo.phase === 'reveal';
  const cardMemes = activeMemes.map(m => toCardMeme(m, isReveal));
  const winnerId = cardMemes.length > 0
    ? cardMemes.reduce((a, b) => (a.votes > b.votes ? a : b)).id
    : undefined;

  return (
    <div className="min-h-screen bg-background relative">
      <RitualHeader phaseInfo={phaseInfo} theme={theme} />

      {loading && !isDemo ? (
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-20 text-center">
          <p className="font-mono text-muted-foreground text-sm animate-pulse-glow">
            Summoning the ritual...
          </p>
        </div>
      ) : generating ? (
        <GeneratingOverlay />
      ) : (
        <AnimatePresence mode="wait">
          {phaseInfo.phase === 'preparing' && (
            <ArchiveSection />
          )}

          {phaseInfo.phase === 'submission' && (
            <div>
              {!isDemo && <SubmitSection onSubmit={handleSubmit} />}
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

      {isDemo && (
        <PhaseSelector
          currentPhase={demoPhase}
          onPhaseChange={setDemoPhase}
          onGenerate={handleGenerate}
          generating={generating}
        />
      )}
    </div>
  );
};

export default Index;
