import type { Phase } from '@/lib/phases';

interface PhaseSelectorProps {
  currentPhase: Phase;
  onPhaseChange: (phase: Phase) => void;
}

const phases: { value: Phase; label: string }[] = [
  { value: 'preparing', label: 'Preparing' },
  { value: 'submission', label: 'Submission' },
  { value: 'voting', label: 'Voting' },
  { value: 'reveal', label: 'Reveal' },
];

const PhaseSelector = ({ currentPhase, onPhaseChange }: PhaseSelectorProps) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-lg p-1 flex gap-1 shadow-2xl">
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider px-2 flex items-center">
        Demo:
      </span>
      {phases.map((p) => (
        <button
          key={p.value}
          onClick={() => onPhaseChange(p.value)}
          className={`font-mono text-xs px-3 py-1.5 rounded-md transition-all ${
            currentPhase === p.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

export default PhaseSelector;
