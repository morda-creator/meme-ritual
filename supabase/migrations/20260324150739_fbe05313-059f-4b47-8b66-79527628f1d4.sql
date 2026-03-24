CREATE TABLE public.host_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.host_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Host messages are publicly readable"
  ON public.host_messages FOR SELECT TO public
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.host_messages;