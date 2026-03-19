import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

const MemeCardSkeleton = ({ index }: { index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.12, duration: 0.4 }}
    className="bg-card border border-border rounded-lg overflow-hidden"
  >
    <div className="relative bg-secondary overflow-hidden">
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="absolute inset-0 scanline pointer-events-none opacity-20" />
    </div>
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <span className="font-mono text-xs text-primary shrink-0">&gt;</span>
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  </motion.div>
);

const GeneratingOverlay = () => {
  const messages = [
    'Consulting the meme oracle…',
    'Channeling internet energy…',
    'The AI is judging your patience…',
    'Summoning dank content…',
  ];

  return (
    <section className="max-w-3xl mx-auto px-6 sm:px-10 py-8">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-mono text-xs text-primary uppercase tracking-widest mb-6 animate-pulse-glow"
      >
        &gt; {messages[Math.floor(Math.random() * messages.length)]}
      </motion.p>
      <div className="grid gap-6">
        {[0, 1, 2, 3].map((i) => (
          <MemeCardSkeleton key={i} index={i} />
        ))}
      </div>
    </section>
  );
};

export default GeneratingOverlay;
