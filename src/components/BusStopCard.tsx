import React, { useState, useEffect } from 'react';
import { BusStop, BusServiceArrival } from '../types/bus';
import { fetchBusArrivals } from '../services/ltaService';
import { BusServiceCard } from './BusServiceCard';
import {
  Star,
  MapPin,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle,
  Filter,
  Layers,
} from 'lucide-react';

interface BusStopCardProps {
  stop: BusStop;
  isFavorite: boolean;
  nickname?: string;
  onToggleFavorite: (stopCode: string, nickname?: string) => void;
  onViewRoute?: (serviceNo: string) => void;
  userApiKey?: string;
  refreshTrigger?: number; // increments when global refresh fires
}

export const BusStopCard: React.FC<BusStopCardProps> = ({
  stop,
  isFavorite,
  nickname,
  onToggleFavorite,
  onViewRoute,
  userApiKey,
  refreshTrigger = 0,
}) => {
  const [arrivals, setArrivals] = useState<BusServiceArrival[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [serviceSearch, setServiceSearch] = useState<string>('');
  const [filterArrivingSoon, setFilterArrivingSoon] = useState<boolean>(false);
  const [filterDoubleDecker, setFilterDoubleDecker] = useState<boolean>(false);
  const [isEditingNickname, setIsEditingNickname] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>(nickname || '');
  const [expanded, setExpanded] = useState<boolean>(true);
  const [alertServices, setAlertServices] = useState<Set<string>>(new Set());
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchBusArrivals(stop.BusStopCode, userApiKey);
      setArrivals(res.arrivals);
      setLastRefreshed(new Date());

      // Check alerts
      res.arrivals.forEach((arr) => {
        if (alertServices.has(arr.ServiceNo) && arr.NextBus && arr.NextBus.minutesAway <= 2) {
          triggerAudioAlert(arr.ServiceNo, arr.NextBus.minutesAway);
        }
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [stop.BusStopCode, refreshTrigger]);

  const triggerAudioAlert = (serviceNo: string, mins: number) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // audio context not allowed without prior gesture
    }
  };

  const handleToggleAlert = (serviceNo: string) => {
    setAlertServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceNo)) {
        next.delete(serviceNo);
      } else {
        next.add(serviceNo);
      }
      return next;
    });
  };

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    onToggleFavorite(stop.BusStopCode, customName.trim() || undefined);
    setIsEditingNickname(false);
  };

  // Filter arrivals
  const filteredArrivals = arrivals.filter((item) => {
    if (serviceSearch && !item.ServiceNo.toLowerCase().includes(serviceSearch.toLowerCase())) {
      return false;
    }
    if (filterArrivingSoon && item.NextBus && item.NextBus.minutesAway > 5) {
      return false;
    }
    if (filterDoubleDecker && item.NextBus && item.NextBus.Type !== 'DD') {
      return false;
    }
    return true;
  });

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden transition-all hover:border-slate-700">
      {/* Header Banner */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800">
        <div className="flex items-start justify-between gap-3">
          {/* Stop Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                {stop.BusStopCode}
              </span>
              {stop.region && (
                <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80">
                  {stop.region}
                </span>
              )}
              {stop.distance !== undefined && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  {stop.distance < 1000
                    ? `${stop.distance}m away`
                    : `${(stop.distance / 1000).toFixed(1)}km away`}
                </span>
              )}
            </div>

            {/* Description & Road */}
            <div className="mt-1.5">
              <h3 className="text-base font-bold text-white tracking-tight truncate flex items-center gap-2">
                <span>{nickname ? `"${nickname}" — ${stop.Description}` : stop.Description}</span>
              </h3>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                <span>{stop.RoadName}</span>
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Manual Refresh */}
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Refresh arrivals now"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Star Favorite */}
            <button
              type="button"
              onClick={() => {
                if (isFavorite && !nickname) {
                  onToggleFavorite(stop.BusStopCode);
                } else if (!isFavorite) {
                  onToggleFavorite(stop.BusStopCode);
                } else {
                  setIsEditingNickname(!isEditingNickname);
                }
              }}
              className={`p-2 rounded-lg border transition-colors ${
                isFavorite
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-amber-400 hover:bg-slate-750'
              }`}
              title={isFavorite ? 'Saved to Favorites (click to edit or remove)' : 'Save to Favorites'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Collapse toggle */}
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nickname Editor Drawer */}
        {(isEditingNickname || (isFavorite && !nickname && isEditingNickname)) && (
          <form onSubmit={handleSaveNickname} className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. 🏠 Home, 🏢 Office, 🎓 School..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => onToggleFavorite(stop.BusStopCode)}
              className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg"
            >
              Remove
            </button>
          </form>
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 space-y-3">
          {/* Quick Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Search Service input */}
            <div className="relative flex-1 min-w-[120px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Filter service no..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Quick toggle: < 5 mins */}
            <button
              type="button"
              onClick={() => setFilterArrivingSoon(!filterArrivingSoon)}
              className={`px-2.5 py-1.5 rounded-lg border font-medium transition-colors inline-flex items-center gap-1 ${
                filterArrivingSoon
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>≤ 5m</span>
            </button>

            {/* Quick toggle: Double Deckers only */}
            <button
              type="button"
              onClick={() => setFilterDoubleDecker(!filterDoubleDecker)}
              className={`px-2.5 py-1.5 rounded-lg border font-medium transition-colors inline-flex items-center gap-1 ${
                filterDoubleDecker
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>DD</span>
            </button>
          </div>

          {/* Bus Services Grid/List */}
          {loading && arrivals.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="text-xs">Fetching real-time arrivals from LTA...</span>
            </div>
          ) : filteredArrivals.length === 0 ? (
            <div className="p-6 text-center text-slate-500 rounded-xl bg-slate-950/40 border border-slate-850">
              <AlertCircle className="w-5 h-5 mx-auto mb-1 text-slate-600" />
              <p className="text-xs">No bus services matching current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredArrivals.map((arr) => (
                <BusServiceCard
                  key={arr.ServiceNo}
                  arrival={arr}
                  stopCode={stop.BusStopCode}
                  onViewRoute={onViewRoute}
                  isAlertSet={alertServices.has(arr.ServiceNo)}
                  onToggleAlert={handleToggleAlert}
                />
              ))}
            </div>
          )}

          {/* Footer refresh info */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Updated at {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-slate-500">
              Auto-updating via LTA live timings
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
