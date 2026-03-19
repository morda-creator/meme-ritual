export type Phase = 'preparing' | 'submission' | 'voting' | 'reveal';

export interface PhaseInfo {
  phase: Phase;
  label: string;
  sublabel: string;
  nextPhaseTime: Date | null;
}

export function getCurrentPhase(): PhaseInfo {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 5=Fri
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  // For demo purposes, let's make it work any day
  // In production, check day === 5 (Friday)
  const isFriday = day === 5;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!isFriday) {
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + ((5 - day + 7) % 7 || 7));
    nextFriday.setHours(9, 0, 0, 0);
    return {
      phase: 'preparing',
      label: 'Preparing ritual',
      sublabel: 'The next ceremony approaches.',
      nextPhaseTime: nextFriday,
    };
  }

  if (currentMinutes < 9 * 60) {
    const start = new Date(today);
    start.setHours(9, 0, 0, 0);
    return {
      phase: 'preparing',
      label: 'Preparing ritual',
      sublabel: 'The altar is being set. Patience.',
      nextPhaseTime: start,
    };
  }

  if (currentMinutes < 13 * 60) {
    const votingStart = new Date(today);
    votingStart.setHours(13, 0, 0, 0);
    return {
      phase: 'submission',
      label: 'Submissions open',
      sublabel: 'Present your offerings.',
      nextPhaseTime: votingStart,
    };
  }

  if (currentMinutes < 16 * 60) {
    const revealTime = new Date(today);
    revealTime.setHours(16, 0, 0, 0);
    return {
      phase: 'voting',
      label: 'Voting open',
      sublabel: 'Judge thy peers. Anonymously.',
      nextPhaseTime: revealTime,
    };
  }

  return {
    phase: 'reveal',
    label: 'Reveal',
    sublabel: 'The truth emerges.',
    nextPhaseTime: null,
  };
}

// For demo: cycle through phases every 60 seconds
export function getDemoPhase(forcePhase?: Phase): PhaseInfo {
  if (forcePhase) {
    const phases: Record<Phase, PhaseInfo> = {
      preparing: {
        phase: 'preparing',
        label: 'Preparing ritual',
        sublabel: 'The altar is being set. Patience.',
        nextPhaseTime: new Date(Date.now() + 30 * 60000),
      },
      submission: {
        phase: 'submission',
        label: 'Submissions open',
        sublabel: 'Present your offerings.',
        nextPhaseTime: new Date(Date.now() + 4 * 3600000),
      },
      voting: {
        phase: 'voting',
        label: 'Voting open',
        sublabel: 'Judge thy peers. Anonymously.',
        nextPhaseTime: new Date(Date.now() + 3 * 3600000),
      },
      reveal: {
        phase: 'reveal',
        label: 'Reveal',
        sublabel: 'The truth emerges.',
        nextPhaseTime: null,
      },
    };
    return phases[forcePhase];
  }
  return getCurrentPhase();
}
