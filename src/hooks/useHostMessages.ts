import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HostMessage {
  id: string;
  message: string;
  message_type: string;
  created_at: string;
}

export function useHostMessages(competitionId: string | null) {
  const [messages, setMessages] = useState<HostMessage[]>([]);

  // Fetch existing messages
  const fetchMessages = useCallback(async () => {
    if (!competitionId) return;
    const { data } = await supabase
      .from('host_messages')
      .select('*')
      .eq('competition_id', competitionId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as HostMessage[]);
  }, [competitionId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!competitionId) return;
    const channel = supabase
      .channel(`host-messages-${competitionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'host_messages',
          filter: `competition_id=eq.${competitionId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as HostMessage]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [competitionId]);

  return { messages };
}

// Demo-only host messages (no DB)
export function useDemoHostMessages() {
  const [messages, setMessages] = useState<HostMessage[]>([]);

  const addMessage = useCallback((message: string, type: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `demo-host-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message,
        message_type: type,
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  const generateHostComment = useCallback(async (
    type: string,
    context: Record<string, unknown>
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('host-comment', {
        body: {
          competition_id: 'demo',
          type,
          context,
          demo: true,
        },
      });
      if (error) throw error;
      addMessage(data.message, type);
    } catch (e) {
      console.error('Demo host comment failed:', e);
      // Fallback messages
      const fallbacks: Record<string, string> = {
        welcome: `The ritual begins. Theme: "${context.theme}". Not all competitors have a heartbeat.`,
        submission_reaction: 'Another offering. The AI is watching.',
        phase_change: 'The phase shifts. Adjust your strategy accordingly.',
        nudge: 'The altar grows cold. Your memes. Where are they.',
      };
      addMessage(fallbacks[type] || '...', type);
    }
  }, [addMessage]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, addMessage, generateHostComment, clearMessages };
}
