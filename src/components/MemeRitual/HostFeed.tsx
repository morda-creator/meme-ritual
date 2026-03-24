import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HostMessage } from '@/hooks/useHostMessages';

const typeIcons: Record<string, string> = {
  welcome: '📡',
  submission_reaction: '👁️',
  phase_change: '⚡',
  nudge: '💀',
  general: '🤖',
};

interface HostFeedProps {
  messages: HostMessage[];
}

const HostFeed = ({ messages }: HostFeedProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-10 py-4">
      <div className="border border-border rounded-lg bg-card/50 overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-secondary/30 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            RITUAL_HOST // live feed
          </span>
        </div>
        <div className="px-4 py-3 max-h-48 overflow-y-auto space-y-2 scrollbar-thin">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-2"
              >
                <span className="text-xs mt-0.5 shrink-0">
                  {typeIcons[msg.message_type] || '🤖'}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xs text-foreground/90 leading-relaxed break-words">
                    {msg.message}
                  </p>
                  <span className="font-mono text-[10px] text-muted-foreground/50">
                    {new Date(msg.created_at).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};

export default HostFeed;
