import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CompMeme {
  id: string;
  image_url: string;
  vote_count: number;
  ai_comment: string | null;
  author_name: string | null;
  is_ai_generated: boolean;
  created_at: string;
}

interface CompInfo {
  theme_title: string;
  theme_intro: string;
  competition_date: string;
  winner_meme_id: string | null;
  winner_announcement: string | null;
}

const CompetitionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [comp, setComp] = useState<CompInfo | null>(null);
  const [memes, setMemes] = useState<CompMeme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);

      const [{ data: compData }, { data: memesData }] = await Promise.all([
        supabase.from('competitions').select('theme_title, theme_intro, competition_date, winner_meme_id, winner_announcement').eq('id', id).single(),
        supabase.from('memes').select('id, image_url, vote_count, ai_comment, author_name, is_ai_generated, created_at').eq('competition_id', id).order('vote_count', { ascending: false }),
      ]);

      setComp(compData);
      setMemes(memesData || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground animate-pulse-glow">
          Opening the archives...
        </p>
      </div>
    );
  }

  if (!comp) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="font-mono text-sm text-muted-foreground">Competition not found.</p>
        <Link to="/" className="font-mono text-xs text-primary hover:underline">
          ← Back to ritual
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border py-8 px-6 sm:px-10">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to ritual
          </Link>

          <p className="font-mono text-xs text-muted-foreground/60 mb-1">
            {new Date(comp.competition_date).toLocaleDateString('da-DK', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          <h1 className="font-mono text-2xl sm:text-3xl font-bold text-foreground mb-2">
            "{comp.theme_title}"
          </h1>

          <p className="text-sm text-muted-foreground italic leading-relaxed max-w-xl">
            {comp.theme_intro}
          </p>

          {comp.winner_announcement && (
            <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="font-mono text-xs text-primary uppercase tracking-wider mb-1">
                Winner announcement
              </p>
              <p className="text-sm text-foreground/80 italic">
                {comp.winner_announcement}
              </p>
            </div>
          )}

          <p className="font-mono text-xs text-muted-foreground/50 mt-4">
            {memes.length} offering{memes.length !== 1 ? 's' : ''} submitted
          </p>
        </div>
      </header>

      {/* Meme grid */}
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-8">
        {memes.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground text-center py-12">
            No memes were submitted for this ritual.
          </p>
        ) : (
          <div className="space-y-6">
            {memes.map((meme, i) => {
              const isWinner = meme.id === comp.winner_meme_id;
              return (
                <motion.div
                  key={meme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className={`bg-card border rounded-lg overflow-hidden ${
                    isWinner ? 'border-primary box-glow' : 'border-border'
                  }`}
                >
                  {isWinner && (
                    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-primary" />
                      <span className="font-mono text-xs text-primary text-glow uppercase tracking-widest">
                        Winner
                      </span>
                    </div>
                  )}

                  <div className="relative bg-secondary overflow-hidden">
                    <img
                      src={meme.image_url}
                      alt="Meme submission"
                      className="w-full h-auto"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 scanline pointer-events-none opacity-20" />
                  </div>

                  <div className="p-4 space-y-3">
                    {meme.ai_comment && (
                      <div className="flex gap-2">
                        <span className="font-mono text-xs text-primary shrink-0">&gt;</span>
                        <p className="font-mono text-sm text-foreground/80 italic leading-relaxed">
                          {meme.ai_comment}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">
                        {meme.is_ai_generated
                          ? '🤖 MEME_RITUAL_BOT'
                          : meme.author_name || 'anonymous'}
                      </span>
                      <span className="font-mono text-xs text-primary">
                        ▲ {meme.vote_count}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionDetail;
