import React from 'react';
import {
  Bus,
  Search,
  Star,
  Navigation,
  Map as MapIcon,
  Settings,
  RefreshCw,
  Clock,
} from 'lucide-react';

export type AppTab = 'search' | 'favorites' | 'near-me' | 'live-map';

interface HeaderProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  favoritesCount: number;
  onOpenSettings: () => void;
  onManualRefresh: () => void;
  autoRefreshCountdown: number;
  autoRefreshEnabled: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  favoritesCount,
  onOpenSettings,
  onManualRefresh,
  autoRefreshCountdown,
  autoRefreshEnabled,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top Navbar */}
        <div className="h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('search')}>
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                  <Bus className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  SG Bus <span className="text-emerald-400">Arrival</span>
                </h1>
                <span className="hidden sm:inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 font-mono">
                  LTA Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Real-time bus arrival timings & live GPS map for Singapore
              </p>
            </div>
          </div>

          {/* Right Controls: Auto-refresh ticker + Manual Refresh + Settings */}
          <div className="flex items-center gap-2">
            {/* Auto-refresh countdown badge */}
            {autoRefreshEnabled && (
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 font-mono"
                title="Next automatic LTA refresh countdown"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{autoRefreshCountdown}s</span>
              </div>
            )}

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={onManualRefresh}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
              title="Refresh all arrival timings immediately"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Settings Modal Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="Settings & LTA API Key"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-t border-slate-800/60 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => onTabChange('search')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'search'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search & All Stops</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('favorites')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'favorites'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'fill-current' : ''}`} />
            <span>Favorites</span>
            {favoritesCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  currentTab === 'favorites'
                    ? 'bg-slate-950 text-amber-300'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('near-me')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'near-me'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Near Me (GPS)</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('live-map')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              currentTab === 'live-map'
                ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/20'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Live SG Map</span>
          </button>
        </div>
      </div>
    </header>
  );
};
