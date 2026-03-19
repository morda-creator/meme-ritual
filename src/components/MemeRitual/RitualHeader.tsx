import { motion } from 'framer-motion';
import type { PhaseInfo } from '@/lib/phases';
import CountdownTimer from './CountdownTimer';

interface RitualHeaderProps {
  phaseInfo: PhaseInfo;
  theme: { title: string; aiIntro: string };
}

const phaseColors: Record<string, string> = {
  preparing: 'text-muted-foreground',
  submission: 'text-primary',
  voting: 'text-accent',
  reveal: 'text-primary',
};

const RitualHeader = ({ phaseInfo, theme }: RitualHeaderProps) => {
  return (
    <header className="relative border-b border-border py-10 px-6 sm:px-10">
      {/* Scanline overlay */}
      <div className="absolute inset-0 scanline pointer-events-none opacity-30" />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-mono text-3xl sm:text-4xl font-bold text-primary text-glow animate-flicker tracking-tight">
            MEME_RITUAL
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-1 tracking-widest uppercase">
            Weekly ceremony of internet culture
          </p>
        </motion.div>

        {/* Phase status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full bg-primary animate-pulse-glow`} />
            <span className={`font-mono text-sm uppercase tracking-wider ${phaseColors[phaseInfo.phase]}`}>
              {phaseInfo.label}
            </span>
          </div>
          {phaseInfo.nextPhaseTime && (
            <CountdownTimer targetTime={phaseInfo.nextPhaseTime} />
          )}
        </motion.div>

        {/* Theme */}
        {phaseInfo.phase === 'preparing' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-secondary/50 border border-border rounded-lg p-5"
          >
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
              This week's theme
            </p>
            <p className="font-mono text-sm text-muted-foreground italic">
              ??? — Theme will be revealed when the ritual begins.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-secondary/50 border border-border rounded-lg p-5"
          >
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-2">
              This week's theme
            </p>
            <h2 className="font-mono text-lg sm:text-xl text-foreground font-bold mb-2">
              "{theme.title}"
            </h2>
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              {theme.aiIntro}
            </p>
          </motion.div>
        )}

        {/* Phase sublabel */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="font-mono text-xs text-muted-foreground mt-4 tracking-wide"
        >
          &gt; {phaseInfo.sublabel}
        </motion.p>
      </div>
    </header>
  );
};

export default RitualHeader;
