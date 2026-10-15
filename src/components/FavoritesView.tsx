import React, { useState } from 'react';
import { BusStop, FavoriteStop } from '../types/bus';
import { SINGAPORE_BUS_STOPS } from '../data/singaporeBuses';
import { BusStopCard } from './BusStopCard';
import { Star, Search, Plus, BookmarkCheck, ArrowRight, Sparkles } from 'lucide-react';

interface FavoritesViewProps {
  favorites: FavoriteStop[];
  onToggleFavorite: (stopCode: string, nickname?: string) => void;
  onViewRoute?: (serviceNo: string) => void;
  userApiKey?: string;
  refreshTrigger?: number;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  onToggleFavorite,
  onViewRoute,
  userApiKey,
  refreshTrigger,
}) => {
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Map favorite records to full BusStop objects
  const favoriteStopsWithData = favorites
    .map((fav) => {
      const stopData = SINGAPORE_BUS_STOPS.find((s) => s.BusStopCode === fav.busStopCode);
      if (!stopData) return null;
      return {
        stop: stopData,
        nickname: fav.nickname,
      };
    })
    .filter(Boolean) as { stop: BusStop; nickname?: string }[];

  const filteredFavorites = favoriteStopsWithData.filter(({ stop, nickname }) => {
    if (!filterSearch) return true;
    const q = filterSearch.toLowerCase();
    return (
      stop.BusStopCode.toLowerCase().includes(q) ||
      stop.RoadName.toLowerCase().includes(q) ||
      stop.Description.toLowerCase().includes(q) ||
      (nickname && nickname.toLowerCase().includes(q))
    );
  });

  const popularSuggestions = [
    { code: '09048', name: 'Opp Somerset Stn', road: 'Orchard Rd' },
    { code: '04121', name: 'Bugis Stn Exit A', road: 'Victoria St' },
    { code: '03059', name: 'Fullerton Sq / Raffles Pl', road: 'Fullerton Rd' },
    { code: '28019', name: 'Jurong East Stn/Jem', road: 'Jurong Gateway' },
    { code: '76141', name: 'Tampines Stn/Int', road: 'Tampines Ave 4' },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Counter header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Saved Bus Stops</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                {favorites.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Instant live arrival tracking for your daily commute stops
            </p>
          </div>
        </div>

        {favorites.length > 0 && (
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Filter your favorites..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        )}
      </div>

      {/* Empty State */}
      {favorites.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">No Favorite Stops Saved Yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Bookmark your daily home, work, or school stops by clicking the star icon on any bus stop card for 1-tap live arrival timing.
            </p>
          </div>

          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-300 mb-2">Quick Add Popular Singapore Stops:</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {popularSuggestions.map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => onToggleFavorite(s.code)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{s.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({s.code})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="p-8 text-center text-slate-500 rounded-xl bg-slate-900/40 border border-slate-800">
          <p className="text-xs">No favorites matching "{filterSearch}".</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFavorites.map(({ stop, nickname }) => (
            <BusStopCard
              key={stop.BusStopCode}
              stop={stop}
              isFavorite={true}
              nickname={nickname}
              onToggleFavorite={onToggleFavorite}
              onViewRoute={onViewRoute}
              userApiKey={userApiKey}
              refreshTrigger={refreshTrigger}
            />
          ))}
        </div>
      )}
    </div>
  );
};
