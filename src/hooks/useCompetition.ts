import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateTheme, generateCommentary, uploadMemeImage, getSessionId } from '@/lib/api';
import type { Tables } from '@/integrations/supabase/types';

type Competition = Tables<'competitions'>;
type MemeRow = Tables<'memes'>;

export interface MemeWithVote extends MemeRow {
  hasVoted: boolean;
}

export function useCompetition() {
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [memes, setMemes] = useState<MemeWithVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const sessionId = getSessionId();

  // Fetch or create today's competition
  const fetchCompetition = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    // Try to get today's competition
    const { data: existing } = await supabase
      .from('competitions')
      .select('*')
      .eq('competition_date', today)
      .maybeSingle();

    if (existing) {
      setCompetition(existing);
      return existing;
    }

    // Generate a new theme via AI
    try {
      const theme = await generateTheme();
      const { data: newComp, error } = await supabase
        .from('competitions')
        .insert({
          theme_title: theme.title,
          theme_intro: theme.intro,
          status: 'submission',
          competition_date: today,
        })
        .select()
        .single();

      if (error) throw error;
      setCompetition(newComp);
      return newComp;
    } catch (e) {
      console.error('Failed to create competition:', e);
      // Fallback theme
      const { data: fallback } = await supabase
        .from('competitions')
        .insert({
          theme_title: 'The Internet Was a Mistake',
          theme_intro: 'And yet here we are, making memes about it. Proceed.',
          status: 'submission',
          competition_date: today,
        })
        .select()
        .single();
      setCompetition(fallback);
      return fallback;
    }
  }, []);

  // Fetch memes for competition
  const fetchMemes = useCallback(async (competitionId: string) => {
    const { data: memesData } = await supabase
      .from('memes')
      .select('*')
      .eq('competition_id', competitionId)
      .order('created_at', { ascending: false });

    // Check which memes user has voted on
    const { data: votesData } = await supabase
      .from('votes')
      .select('meme_id')
      .eq('session_id', sessionId);

    const votedIds = new Set(votesData?.map(v => v.meme_id) || []);

    const withVotes: MemeWithVote[] = (memesData || []).map(m => ({
      ...m,
      hasVoted: votedIds.has(m.id),
    }));

    setMemes(withVotes);
  }, [sessionId]);

  // Init
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const comp = await fetchCompetition();
      if (comp) await fetchMemes(comp.id);
      setLoading(false);
    };
    init();
  }, [fetchCompetition, fetchMemes]);

  // Real-time subscription for new memes
  useEffect(() => {
    if (!competition?.id) return;

    const channel = supabase
      .channel('memes-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memes', filter: `competition_id=eq.${competition.id}` },
        () => fetchMemes(competition.id)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [competition?.id, fetchMemes]);

  // Submit meme
  const submitMeme = useCallback(async (file: File, authorName?: string) => {
    if (!competition) return;
    setSubmitting(true);

    try {
      const imageUrl = await uploadMemeImage(file);

      // Get AI commentary
      let aiComment = 'The AI contemplates in silence.';
      try {
        aiComment = await generateCommentary(competition.theme_title, `A meme about "${competition.theme_title}"`);
      } catch (e) {
        console.error('Commentary generation failed:', e);
      }

      await supabase.from('memes').insert({
        competition_id: competition.id,
        image_url: imageUrl,
        ai_comment: aiComment,
        session_id: sessionId,
        author_name: authorName || null,
      });

      await fetchMemes(competition.id);
    } catch (e) {
      console.error('Failed to submit meme:', e);
      throw e;
    } finally {
      setSubmitting(false);
    }
  }, [competition, sessionId, fetchMemes]);

  // Vote
  const vote = useCallback(async (memeId: string) => {
    try {
      const { error } = await supabase.from('votes').insert({
        meme_id: memeId,
        session_id: sessionId,
      });
      if (error) {
        if (error.code === '23505') return; // duplicate vote
        throw error;
      }
      if (competition) await fetchMemes(competition.id);
    } catch (e) {
      console.error('Vote failed:', e);
    }
  }, [sessionId, competition, fetchMemes]);

  return {
    competition,
    memes,
    loading,
    submitting,
    submitMeme,
    vote,
  };
}
