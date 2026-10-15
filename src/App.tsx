import React, { useState, useEffect, useMemo } from 'react';
import { BusStop, FavoriteStop } from './types/bus';
import { SINGAPORE_BUS_STOPS } from './data/singaporeBuses';
import { Header, AppTab } from './components/Header';
import { BusStopCard } from './components/BusStopCard';
import { FavoritesView } from './components/FavoritesView';
import { NearMeView } from './components/NearMeView';
import { BusRouteModal } from './components/BusRouteModal';
import { SettingsModal } from './components/SettingsModal';
import {
  Search,
  MapPin,
  Bus,
  Filter,
  Layers,
  Sparkles,
  Info,
  X,
  Compass,
} from 'lucide-react';

const LOCAL_STORAGE_FAVORITES_KEY = 'sg_bus_favorites_v2';
const LOCAL_STORAGE_API_KEY = 'sg_bus_lta_api_key';
const LOCAL_STORAGE_INTERVAL_KEY = 'sg_bus_refresh_interval';
const LOCAL_STORAGE_SOUND_KEY = 'sg_bus_sound_alert';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('search');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  // Favorites state
  const [favorites, setFavorites] = useState<FavoriteStop[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FAVORITES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Default initial favorites
    return [
      {
        id: 'fav-09048',
        busStopCode: '09048',
        nickname: '🏠 Home (Orchard / Somerset)',
        createdTimestamp: Date.now(),
      },
      {
        id: 'fav-04121',
        busStopCode: '04121',
        nickname: '🏢 Office (Bugis Junction)',
        createdTimestamp: Date.now() - 100000,
      },
      {
        id: 'fav-03059',
        busStopCode: '03059',
        nickname: 'Fullerton Sq / Raffles Pl',
        createdTimestamp: Date.now() - 200000,
      },
    ];
  });

  // Settings state
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_API_KEY) || '';
  });
  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    const val = localStorage.getItem(LOCAL_STORAGE_INTERVAL_KEY);
    return val ? parseInt(val, 10) : 15000; // 15 seconds default
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_STORAGE_SOUND_KEY) !== 'false';
  });

  // Modals & Active Selections
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeRouteService, setActiveRouteService] = useState<string | null>(null);

  // Geolocation
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Auto-refresh countdown ticker
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(Math.floor(refreshInterval / 1000));

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  // Persist settings
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(LOCAL_STORAGE_API_KEY, key);
  };

  const handleSaveInterval = (interval: number) => {
    setRefreshInterval(interval);
    localStorage.setItem(LOCAL_STORAGE_INTERVAL_KEY, interval.toString());
    setCountdown(Math.floor(interval / 1000));
  };

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem(LOCAL_STORAGE_SOUND_KEY, enabled.toString());
  };

  // Auto-refresh loop
  useEffect(() => {
    if (refreshInterval <= 0) return;

    setCountdown(Math.floor(refreshInterval / 1000));

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setRefreshTrigger((c) => c + 1);
          return Math.floor(refreshInterval / 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [refreshInterval]);

  const handleManualRefresh = () => {
    setRefreshTrigger((c) => c + 1);
    setCountdown(Math.floor(refreshInterval / 1000));
  };

  // Toggle favorite
  const handleToggleFavorite = (stopCode: string, nickname?: string) => {
    setFavorites((prev) => {
      const existing = prev.find((f) => f.busStopCode === stopCode);
      if (existing) {
        if (nickname !== undefined) {
          // Update nickname
          return prev.map((f) => (f.busStopCode === stopCode ? { ...f, nickname } : f));
        }
        // Remove favorite
        return prev.filter((f) => f.busStopCode !== stopCode);
      } else {
        // Add favorite
        const newFav: FavoriteStop = {
          id: `fav-${stopCode}-${Date.now()}`,
          busStopCode: stopCode,
          nickname,
          createdTimestamp: Date.now(),
        };
        return [newFav, ...prev];
      }
    });
  };

  const favoriteStopCodes = useMemo(
    () => favorites.map((f) => f.busStopCode),
    [favorites]
  );

  // Filter bus stops for the search tab
  const filteredStops = useMemo(() => {
    let result = SINGAPORE_BUS_STOPS;

    if (selectedRegion !== 'All') {
      result = result.filter((s) => s.region === selectedRegion);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((s) => {
        const matchesCode = s.BusStopCode.toLowerCase().includes(q);
        const matchesDesc = s.Description.toLowerCase().includes(q);
        const matchesRoad = s.RoadName.toLowerCase().includes(q);
        const matchesService = s.services.some((svc) => svc.toLowerCase() === q);
        return matchesCode || matchesDesc || matchesRoad || matchesService;
      });
    }

    return result;
  }, [searchQuery, selectedRegion]);

  const regions = ['All', 'Central', 'East', 'West', 'North', 'North-East'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* App Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
        }}
        favoritesCount={favorites.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onManualRefresh={handleManualRefresh}
        autoRefreshCountdown={countdown}
        autoRefreshEnabled={refreshInterval > 0}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* 1. SEARCH & ALL STOPS TAB */}
        {currentTab === 'search' && (
          <div className="space-y-6">
            {/* Search Header Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 shadow-xl space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Track Real-Time Singapore Bus Arrivals</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    LTA DataMall
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Search by 5-digit bus stop code, landmark, road name, or bus service number
                </p>
              </div>

              {/* Big Search Input */}
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Try '09048', 'Orchard', 'Bugis', 'Victoria St', '190', '65'..."
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Tags: Regions + Sample Bus Stops */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                {/* Region filter pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                  {regions.map((reg) => (
                    <button
                      key={reg}
                      type="button"
                      onClick={() => setSelectedRegion(reg)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedRegion === reg
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-750'
                      }`}
                    >
                      {reg}
                    </button>
                  ))}
                </div>

                {/* Quick Shortcuts */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto scrollbar-none">
                  <span className="text-[11px] text-slate-500 hidden sm:inline">Popular:</span>
                  {[
                    { label: 'Somerset', code: '09048' },
                    { label: 'Bugis', code: '04121' },
                    { label: 'Jurong East', code: '28019' },
                    { label: 'Tampines', code: '76141' },
                  ].map((pop) => (
                    <button
                      key={pop.code}
                      type="button"
                      onClick={() => setSearchQuery(pop.code)}
                      className="px-2 py-0.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-emerald-400 border border-slate-700/60 whitespace-nowrap transition-colors"
                    >
                      {pop.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results count & Quick Info Banner */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Showing <strong>{filteredStops.length}</strong> Singapore Bus{' '}
                {filteredStops.length === 1 ? 'Stop' : 'Stops'}
              </span>
              <div className="hidden sm:flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Seats Avail
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Standing
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Crowded
                </span>
                <span className="text-slate-600">|</span>
                <span className="font-mono text-slate-400">DD = Double Deck</span>
              </div>
            </div>

            {/* Bus Stops List */}
            {filteredStops.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
                <p className="text-sm text-slate-400">
                  No bus stops matching "{searchQuery}". Try searching by 5-digit code or road name.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRegion('All');
                  }}
                  className="mt-3 px-4 py-2 bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl"
                >
                  Clear Search Filter
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStops.map((stop) => {
                  const isFav = favoriteStopCodes.includes(stop.BusStopCode);
                  const favItem = favorites.find((f) => f.busStopCode === stop.BusStopCode);
                  return (
                    <BusStopCard
                      key={stop.BusStopCode}
                      stop={stop}
                      isFavorite={isFav}
                      nickname={favItem?.nickname}
                      onToggleFavorite={handleToggleFavorite}
                      onViewRoute={(svc) => setActiveRouteService(svc)}
                      userApiKey={apiKey}
                      refreshTrigger={refreshTrigger}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. FAVORITES TAB */}
        {currentTab === 'favorites' && (
          <FavoritesView
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onViewRoute={(svc) => setActiveRouteService(svc)}
            userApiKey={apiKey}
            refreshTrigger={refreshTrigger}
          />
        )}

        {/* 3. NEAR ME (GPS RADAR) TAB */}
        {currentTab === 'near-me' && (
          <NearMeView
            userLocation={userLocation}
            setUserLocation={setUserLocation}
            favorites={favoriteStopCodes}
            onToggleFavorite={handleToggleFavorite}
            onViewRoute={(svc) => setActiveRouteService(svc)}
            userApiKey={apiKey}
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      {/* Bus Route Timeline Modal */}
      {activeRouteService && (
        <BusRouteModal
          serviceNo={activeRouteService}
          onClose={() => setActiveRouteService(null)}
          onSelectStop={(stop) => {
            setCurrentTab('search');
            setSearchQuery(stop.BusStopCode);
          }}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          apiKey={apiKey}
          onSaveApiKey={handleSaveApiKey}
          refreshInterval={refreshInterval}
          onSaveRefreshInterval={handleSaveInterval}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          favorites={favorites}
          onImportFavorites={(favs) => setFavorites(favs)}
          onClearFavorites={() => setFavorites([])}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© Der Shings Bus Arrivals • Powered by Singapore Land Transport Authority (LTA) DataMall standards</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-400 font-mono">Live LTA Bus Headways</span>
            <span>•</span>
            <span className="text-slate-400">Seats / Standing / Crowded Load Tracking</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-400 hover:text-white underline"
            >
              LTA AccountKey Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
