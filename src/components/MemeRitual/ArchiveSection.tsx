import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useArchive } from '@/hooks/useArchive';
import CountdownTimer from './CountdownTimer';
import { Trophy, ChevronRight } from 'lucide-react';

function getNextFriday9CET(): Date {
  const now = new Date();
  // Work in UTC; CET = UTC+1, so 09:00 CET = 08:00 UTC
  const target = new Date(now);
  const day = target.getUTCDay(); // 0=Sun
  const daysUntilFriday = ((5 - day) + 7) % 7 || 7; // always next Friday
  target.setUTCDate(target.getUTCDate() + daysUntilFriday);
  target.setUTCHours(8, 0, 0, 0);

  // If it's Friday but before 09:00 CET, use today
  if (day === 5 && now < target) {
    // target is already correct for today
    target.setUTCDate(target.getUTCDate() - 7 + 7); // no-op, keep
  }

  return target;
}

const ArchiveSection = () => {
  const { pastCompetitions, loading } = useArchive();
  const nextRitual = getNextFriday9CET();

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-10 py-12">
      {/* Countdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-4">
          The next ritual begins in
        </p>
        <CountdownTimer targetTime={nextRitual} />
        <p className="font-mono text-xs text-muted-foreground/50 mt-4">
          &gt; Prepare your offerings.
        </p>
      </motion.div>

      {/* Archive */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-mono text-sm text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Hall of Fame
        </h2>

        {loading ? (
          <p className="font-mono text-xs text-muted-foreground animate-pulse-glow">
            Consulting the archives...
          </p>
        ) : pastCompetitions.length === 0 ? (
          <div className="border border-border rounded-lg p-8 text-center bg-secondary/30">
            <p className="font-mono text-sm text-muted-foreground">
              No rituals have concluded.
            </p>
            <p className="font-mono text-xs text-muted-foreground/50 mt-1">
              The archive awaits.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastCompetitions.map((comp, i) => (
              <Link key={comp.id} to={`/competition/${comp.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="border border-border rounded-lg bg-secondary/30 p-4 flex gap-4 hover:border-primary/40 hover:bg-secondary/50 transition-colors cursor-pointer group"
              >
                {/* Winner thumbnail */}
                {comp.winner_image_url && (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded overflow-hidden border border-border flex-shrink-0">
                    <img
                      src={comp.winner_image_url}
                      alt={`Winner of "${comp.theme_title}"`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-muted-foreground/60 mb-1">
                    {new Date(comp.competition_date).toLocaleDateString('da-DK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <h3 className="font-mono text-sm font-bold text-foreground truncate">
                    "{comp.theme_title}"
                  </h3>

                  {comp.winner_announcement && (
                    <p className="font-mono text-xs text-muted-foreground mt-1 line-clamp-2 italic">
                      {comp.winner_announcement}
                    </p>
                  )}

                  {comp.winner_vote_count !== null && (
                    <p className="font-mono text-xs text-primary mt-2">
                      ▲ {comp.winner_vote_count} votes
                      {comp.winner_author && (
                        <span className="text-muted-foreground"> · {comp.winner_author}</span>
                      )}
                    </p>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors ml-auto flex-shrink-0" />
                </div>
              </motion.div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ArchiveSection;
