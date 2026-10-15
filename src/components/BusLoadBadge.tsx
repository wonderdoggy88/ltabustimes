import React from 'react';
import { BusLoad, BusType } from '../types/bus';
import { Users, Accessibility, Layers } from 'lucide-react';

interface BusLoadBadgeProps {
  load: BusLoad;
  compact?: boolean;
}

export const BusLoadBadge: React.FC<BusLoadBadgeProps> = ({ load, compact = false }) => {
  switch (load) {
    case 'SEA':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 shadow-sm ${
            compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
          title="Seats Available (LTA SEA)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <Users className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          <span>{compact ? 'Seats' : 'Seats Avail'}</span>
        </span>
      );
    case 'SDA':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/50 shadow-sm ${
            compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
          title="Standing Available (LTA SDA)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <Users className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          <span>{compact ? 'Standing' : 'Standing Avail'}</span>
        </span>
      );
    case 'LSD':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-rose-950/80 text-rose-300 border border-rose-600/50 shadow-sm ${
            compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
          title="Limited Standing (LTA LSD - Crowded)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          <Users className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          <span>{compact ? 'Crowded' : 'Limited Standing'}</span>
        </span>
      );
    default:
      return null;
  }
};

interface BusDeckBadgeProps {
  type: BusType;
  wab?: boolean;
  compact?: boolean;
}

export const BusDeckBadge: React.FC<BusDeckBadgeProps> = ({ type, wab = true, compact = false }) => {
  const getTypeLabel = (t: BusType) => {
    if (t === 'DD') return 'Double Deck';
    if (t === 'BD') return 'Bendy';
    return 'Single Deck';
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded bg-slate-800 text-slate-300 border border-slate-700/80 font-mono font-medium ${
          compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
        }`}
        title={getTypeLabel(type)}
      >
        <Layers className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        <span>{type}</span>
      </span>

      {wab && (
        <span
          className={`inline-flex items-center rounded bg-sky-950/70 text-sky-300 border border-sky-800/60 ${
            compact ? 'p-0.5 text-[10px]' : 'px-1.5 py-0.5 text-xs'
          }`}
          title="Wheelchair Accessible Bus (WAB)"
        >
          <Accessibility className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        </span>
      )}
    </div>
  );
};
