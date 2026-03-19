import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export async function generateTheme(): Promise<{ title: string; intro: string }> {
  const { data, error } = await supabase.functions.invoke('generate-theme');
  if (error) throw error;
  return data;
}

export async function generateCommentary(theme: string, memeDescription: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-commentary', {
    body: { theme, memeDescription },
  });
  if (error) throw error;
  return data.comment;
}

export async function announceWinner(
  theme: string,
  winnerDescription: string,
  totalMemes?: number,
  totalVotes?: number
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('announce-winner', {
    body: { theme, winnerDescription, totalMemes, totalVotes },
  });
  if (error) throw error;
  return data.announcement;
}

export async function uploadMemeImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from('memes').upload(path, file);
  if (error) throw error;

  const { data } = supabase.storage.from('memes').getPublicUrl(path);
  return data.publicUrl;
}

// Session ID for anonymous voting
export function getSessionId(): string {
  let id = localStorage.getItem('meme_ritual_session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('meme_ritual_session', id);
  }
  return id;
}
