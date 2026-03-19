export type Phase = 'preparing' | 'submission' | 'voting' | 'reveal';

export interface PhaseInfo {
  phase: Phase;
  label: string;
  sublabel: string;
  nextPhaseTime: Date | null;
}

const PHASE_META: Record<Phase, { label: string; sublabel: string }> = {
  preparing: { label: 'Preparing ritual', sublabel: 'The altar is being set. Patience.' },
  submission: { label: 'Submissions open', sublabel: 'Present your offerings.' },
  voting: { label: 'Voting open', sublabel: 'Judge thy peers. Anonymously.' },
  reveal: { label: 'Reveal', sublabel: 'The truth emerges.' },
};

/** Map a DB competition status string to a Phase */
export function statusToPhase(status: string): Phase {
  if (['submission', 'voting', 'reveal', 'preparing'].includes(status)) {
    return status as Phase;
  }
  return 'preparing';
}

/** Get the next phase transition time based on current phase (CET = UTC+1) */
export function getNextPhaseTime(phase: Phase): Date | null {
  if (phase === 'reveal') return null;

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // All times in UTC (CET - 1)
  if (phase === 'preparing') {
    // Next phase: submission at 08:00 UTC (09:00 CET)
    const next = getNextFriday(today);
    next.setUTCHours(8, 0, 0, 0);
    return next;
  }
  if (phase === 'submission') {
    // Next phase: voting at 12:00 UTC (13:00 CET)
    const target = new Date(today);
    target.setUTCHours(12, 0, 0, 0);
    return target > now ? target : null;
  }
  if (phase === 'voting') {
    // Next phase: reveal at 15:00 UTC (16:00 CET)
    const target = new Date(today);
    target.setUTCHours(15, 0, 0, 0);
    return target > now ? target : null;
  }
  return null;
}

function getNextFriday(today: Date): Date {
  const day = today.getUTCDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  const next = new Date(today);
  next.setUTCDate(next.getUTCDate() + daysUntilFriday);
  return next;
}

/** Build PhaseInfo from a DB competition status */
export function phaseInfoFromStatus(status: string): PhaseInfo {
  const phase = statusToPhase(status);
  const meta = PHASE_META[phase];
  return {
    phase,
    label: meta.label,
    sublabel: meta.sublabel,
    nextPhaseTime: getNextPhaseTime(phase),
  };
}

/** For demo mode — force a specific phase */
export function getDemoPhase(forcePhase: Phase): PhaseInfo {
  const meta = PHASE_META[forcePhase];
  const demoTimes: Record<Phase, Date | null> = {
    preparing: new Date(Date.now() + 30 * 60000),
    submission: new Date(Date.now() + 4 * 3600000),
    voting: new Date(Date.now() + 3 * 3600000),
    reveal: null,
  };
  return {
    phase: forcePhase,
    label: meta.label,
    sublabel: meta.sublabel,
    nextPhaseTime: demoTimes[forcePhase],
  };
}
