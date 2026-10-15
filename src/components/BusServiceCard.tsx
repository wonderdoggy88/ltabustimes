import React from 'react';
import { BusServiceArrival, BusOperator } from '../types/bus';
import { BusLoadBadge, BusDeckBadge } from './BusLoadBadge';
import { Navigation, Bell, Route, Compass } from 'lucide-react';

interface BusServiceCardProps {
  arrival: BusServiceArrival;
  stopCode: string;
  onTrackOnMap?: (serviceNo: string) => void;
  onViewRoute?: (serviceNo: string) => void;
  isAlertSet?: boolean;
  onToggleAlert?: (serviceNo: string) => void;
}

const OPERATOR_COLORS: Record<BusOperator, { bg: string; text: string; border: string }> = {
  SBST: { bg: 'bg-purple-950/70', text: 'text-purple-300', border: 'border-purple-700/60' },
  SMRT: { bg: 'bg-rose-950/70', text: 'text-rose-300', border: 'border-rose-700/60' },
  TTS: { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-700/60' },
  GAS: { bg: 'bg-amber-950/70', text: 'text-amber-300', border: 'border-amber-700/60' },
};

export const BusServiceCard: React.FC<BusServiceCardProps> = ({
  arrival,
  onTrackOnMap,
  onViewRoute,
  isAlertSet = false,
  onToggleAlert,
}) => {
  const { ServiceNo, Operator, NextBus, NextBus2, NextBus3, inService } = arrival;
  const opStyle = OPERATOR_COLORS[Operator] || OPERATOR_COLORS.SBST;

  if (!inService || !NextBus || NextBus.minutesAway === 999) {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold text-slate-300 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono">
            {ServiceNo}
          </span>
          <span className="text-xs text-slate-500 font-medium">Service currently not in operation</span>
        </div>
      </div>
    );
  }

  const formatArrivalDisplay = (mins: number) => {
    if (mins <= 0) return { text: 'Arr', isImmediate: true };
    if (mins === 1) return { text: '1 min', isImmediate: true };
    return { text: `${mins} min`, isImmediate: false };
  };

  const next1Display = formatArrivalDisplay(NextBus.minutesAway);

  return (
    <div className="group relative overflow-hidden rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all p-3.5 shadow-md hover:shadow-emerald-950/20">
      {/* Top row: Service No, Operator, Primary Next Bus ETA */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Service badge and operator */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="inline-flex items-center justify-center min-w-[58px] px-2.5 py-1 text-2xl font-black text-white bg-slate-800/90 rounded-lg border border-slate-700 font-mono tracking-tight shadow-inner">
              {ServiceNo}
            </span>
            {NextBus.isArriving && (
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${opStyle.bg} ${opStyle.text} ${opStyle.border}`}
              >
                {Operator}
              </span>
              <BusDeckBadge type={NextBus.Type} wab={NextBus.Feature === 'WAB'} compact />
            </div>
            <div className="mt-1">
              <BusLoadBadge load={NextBus.Load} compact />
            </div>
          </div>
        </div>

        {/* Right: Big Arrival Time */}
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span
              className={`font-black tracking-tight font-mono ${
                next1Display.isImmediate
                  ? 'text-3xl text-emerald-400 animate-pulse'
                  : NextBus.minutesAway <= 5
                  ? 'text-3xl text-emerald-300'
                  : 'text-3xl text-slate-100'
              }`}
            >
              {next1Display.text}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            {next1Display.isImmediate ? 'Arriving at stop' : 'Estimated arrival'}
          </span>
        </div>
      </div>

      {/* Middle row: Subsequent buses (NextBus2 & NextBus3) */}
      {(NextBus2 || NextBus3) && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            {NextBus2 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">2nd:</span>
                <span className="font-semibold text-slate-200 font-mono">
                  {NextBus2.minutesAway <= 0 ? 'Arr' : `${NextBus2.minutesAway}m`}
                </span>
                <BusDeckBadge type={NextBus2.Type} wab={NextBus2.Feature === 'WAB'} compact />
                <BusLoadBadge load={NextBus2.Load} compact />
              </div>
            )}
            {NextBus3 && (
              <div className="hidden sm:flex items-center gap-1.5 border-l border-slate-800 pl-3">
                <span className="text-slate-500 text-[11px]">3rd:</span>
                <span className="font-semibold text-slate-300 font-mono">
                  {NextBus3.minutesAway <= 0 ? 'Arr' : `${NextBus3.minutesAway}m`}
                </span>
                <BusDeckBadge type={NextBus3.Type} wab={NextBus3.Feature === 'WAB'} compact />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action shortcuts */}
      <div className="mt-2.5 flex items-center justify-end gap-1.5">
        {onToggleAlert && (
          <button
            type="button"
            onClick={() => onToggleAlert(ServiceNo)}
            className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md transition-colors ${
              isAlertSet
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title={isAlertSet ? 'Arrival reminder is ON (2 mins away)' : 'Notify when 2 mins away'}
          >
            <Bell className={`w-3.5 h-3.5 ${isAlertSet ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isAlertSet ? 'Alert On' : 'Remind'}</span>
          </button>
        )}

        {onViewRoute && (
          <button
            type="button"
            onClick={() => onViewRoute(ServiceNo)}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 px-2.5 py-1 rounded-md transition-colors"
            title="View bus stop sequence route"
          >
            <Route className="w-3.5 h-3.5" />
            <span>Route</span>
          </button>
        )}

        {onTrackOnMap && (
          <button
            type="button"
            onClick={() => onTrackOnMap(ServiceNo)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 px-2.5 py-1 rounded-md transition-colors"
            title="Track live moving bus on Singapore map"
          >
            <Compass className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Live GPS</span>
          </button>
        )}
      </div>
    </div>
  );
};
