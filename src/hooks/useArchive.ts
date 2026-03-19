import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PastCompetition {
  id: string;
  theme_title: string;
  theme_intro: string;
  competition_date: string;
  winner_announcement: string | null;
  winner_image_url: string | null;
  winner_vote_count: number | null;
  winner_author: string | null;
}

export function useArchive() {
  const [pastCompetitions, setPastCompetitions] = useState<PastCompetition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      const { data: comps } = await supabase
        .from('competitions')
        .select('*')
        .eq('status', 'reveal')
        .order('competition_date', { ascending: false })
        .limit(20);

      if (!comps || comps.length === 0) {
        setPastCompetitions([]);
        setLoading(false);
        return;
      }

      // Fetch winning memes
      const winnerIds = comps
        .map(c => c.winner_meme_id)
        .filter((id): id is string => !!id);

      let memesMap: Record<string, { image_url: string; vote_count: number; author_name: string | null }> = {};

      if (winnerIds.length > 0) {
        const { data: memes } = await supabase
          .from('memes')
          .select('id, image_url, vote_count, author_name')
          .in('id', winnerIds);

        if (memes) {
          memesMap = Object.fromEntries(memes.map(m => [m.id, m]));
        }
      }

      const mapped: PastCompetition[] = comps.map(c => {
        const winner = c.winner_meme_id ? memesMap[c.winner_meme_id] : null;
        return {
          id: c.id,
          theme_title: c.theme_title,
          theme_intro: c.theme_intro,
          competition_date: c.competition_date,
          winner_announcement: c.winner_announcement,
          winner_image_url: winner?.image_url || null,
          winner_vote_count: winner?.vote_count ?? null,
          winner_author: winner?.author_name || null,
        };
      });

      setPastCompetitions(mapped);
      setLoading(false);
    };

    fetch();
  }, []);

  return { pastCompetitions, loading };
}
