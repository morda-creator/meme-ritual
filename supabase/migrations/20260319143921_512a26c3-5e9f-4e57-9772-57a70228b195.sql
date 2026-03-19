-- Create competitions table
CREATE TABLE public.competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_title TEXT NOT NULL,
  theme_intro TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'submission', 'voting', 'reveal', 'completed')),
  winner_meme_id UUID,
  winner_announcement TEXT,
  competition_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create memes table
CREATE TABLE public.memes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  ai_comment TEXT,
  author_name TEXT,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  session_id TEXT,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meme_id UUID NOT NULL REFERENCES public.memes(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meme_id, session_id)
);

-- Enable RLS
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Competitions: everyone can read
CREATE POLICY "Competitions are publicly readable" ON public.competitions FOR SELECT USING (true);

-- Memes: everyone can read, anyone can insert
CREATE POLICY "Memes are publicly readable" ON public.memes FOR SELECT USING (true);
CREATE POLICY "Anyone can submit memes" ON public.memes FOR INSERT WITH CHECK (true);

-- Votes: everyone can read, anyone can insert
CREATE POLICY "Votes are publicly readable" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Anyone can vote" ON public.votes FOR INSERT WITH CHECK (true);

-- Storage bucket for meme images
INSERT INTO storage.buckets (id, name, public) VALUES ('memes', 'memes', true);

CREATE POLICY "Meme images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'memes');
CREATE POLICY "Anyone can upload memes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'memes');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment vote count
CREATE OR REPLACE FUNCTION public.increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.memes SET vote_count = vote_count + 1 WHERE id = NEW.meme_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_vote_inserted
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.increment_vote_count();