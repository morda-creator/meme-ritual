import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MemeWithVote } from '@/hooks/useCompetition';

interface DemoTheme {
  title: string;
  intro: string;
}

interface DemoMemeRaw {
  imageUrl: string;
  aiComment: string;
  authorName: string;
  voteCount: number;
}

export function useDemo() {
  const [demoTheme, setDemoTheme] = useState<DemoTheme | null>(null);
  const [demoMemes, setDemoMemes] = useState<MemeWithVote[]>([]);
  const [generating, setGenerating] = useState(false);

  const generateDemo = useCallback(async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('demo-generate');
      if (error) throw error;

      setDemoTheme(data.theme);

      const memes: MemeWithVote[] = (data.memes as DemoMemeRaw[]).map((m, i) => ({
        id: `demo-${Date.now()}-${i}`,
        competition_id: 'demo',
        image_url: m.imageUrl,
        ai_comment: m.aiComment,
        author_name: m.authorName,
        is_ai_generated: true,
        session_id: `demo-bot-${i}`,
        vote_count: m.voteCount,
        created_at: new Date(Date.now() - i * 60000).toISOString(),
        hasVoted: false,
      }));

      setDemoMemes(memes);
    } catch (e) {
      console.error('Demo generation failed:', e);
      throw e;
    } finally {
      setGenerating(false);
    }
  }, []);

  const demoSubmit = useCallback(async (file: File, authorName?: string) => {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

    const newMeme: MemeWithVote = {
      id: `demo-submit-${Date.now()}`,
      competition_id: 'demo',
      image_url: dataUrl,
      ai_comment: 'The AI contemplates your offering in silence.',
      author_name: authorName || null,
      is_ai_generated: false,
      session_id: 'demo-user',
      vote_count: 0,
      created_at: new Date().toISOString(),
      hasVoted: false,
    };

    setDemoMemes(prev => [newMeme, ...prev]);
  }, []);

  const demoVote = useCallback((memeId: string) => {
    setDemoMemes(prev => prev.map(m =>
      m.id === memeId && !m.hasVoted
        ? { ...m, vote_count: m.vote_count + 1, hasVoted: true }
        : m
    ));
  }, []);

  return { demoTheme, demoMemes, generating, generateDemo, demoVote };
}
