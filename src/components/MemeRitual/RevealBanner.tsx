import { motion } from 'framer-motion';

interface RevealBannerProps {
  announcement: string;
}

const RevealBanner = ({ announcement }: RevealBannerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-6 sm:px-10 py-8"
    >
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 box-glow-strong">
        <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
          &gt; RITUAL COMPLETE
        </p>
        <p className="font-mono text-sm text-foreground/90 italic leading-relaxed">
          "{announcement}"
        </p>
        <p className="font-mono text-xs text-muted-foreground mt-3">
          — MEME_RITUAL_BOT
        </p>
      </div>
    </motion.div>
  );
};

export default RevealBanner;
