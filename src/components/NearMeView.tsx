import React, { useState } from 'react';
import { BusStop } from '../types/bus';
import { SINGAPORE_BUS_STOPS, SINGAPORE_HUBS } from '../data/singaporeBuses';
import { getDistanceMeters } from '../services/ltaService';
import { BusStopCard } from './BusStopCard';
import { Navigation, Locate, Compass, Footprints, AlertCircle, Sparkles } from 'lucide-react';

interface NearMeViewProps {
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  favorites: string[];
  onToggleFavorite: (stopCode: string, nickname?: string) => void;
  onSelectOnMap: (stop: BusStop, serviceNo?: string) => void;
  onViewRoute?: (serviceNo: string) => void;
  userApiKey?: string;
  refreshTrigger?: number;
}

export const NearMeView: React.FC<NearMeViewProps> = ({
  userLocation,
  setUserLocation,
  favorites,
  onToggleFavorite,
  onSelectOnMap,
  onViewRoute,
  userApiKey,
  refreshTrigger,
}) => {
  const [locating, setLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedHubName, setSelectedHubName] = useState<string>('Orchard / Somerset');

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setSelectedHubName('My Real Location');
      },
      (err) => {
        setLocating(false);
        setGpsError(err.message || 'Unable to retrieve your location. Try picking a Singapore hub below.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSelectHub = (hub: typeof SINGAPORE_HUBS[0]) => {
    setUserLocation({ lat: hub.lat, lng: hub.lng });
    setSelectedHubName(hub.name);
    setGpsError(null);
  };

  // Current reference point (defaults to Orchard if none)
  const currentPos = userLocation || { lat: 1.30076, lng: 103.83907 };

  // Calculate distances to all stops and sort ascending
  const stopsWithDistance: BusStop[] = SINGAPORE_BUS_STOPS.map((stop) => {
    const dist = getDistanceMeters(currentPos.lat, currentPos.lng, stop.Latitude, stop.Longitude);
    return {
      ...stop,
      distance: dist,
    };
  }).sort((a, b) => (a.distance || 0) - (b.distance || 0));

  // Top 10 closest stops
  const nearestStops = stopsWithDistance.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Geolocation Card */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Nearby Singapore Bus Stops</span>
              </h2>
              <p className="text-xs text-slate-400">
                Sorted by walking distance from: <strong className="text-cyan-300">{selectedHubName}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGetLocation}
            disabled={locating}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            <Locate className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Detecting GPS...' : 'Use My GPS Location'}</span>
          </button>
        </div>

        {gpsError && (
          <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Quick Hub Teleporter Selector */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Explore Singapore Transit Hubs:</span>
            </span>
            <span className="text-[11px] text-slate-500">Click to teleport reference point</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SINGAPORE_HUBS.map((hub) => (
              <button
                key={hub.name}
                type="button"
                onClick={() => handleSelectHub(hub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  selectedHubName === hub.name
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
                }`}
              >
                {hub.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nearest Stops List */}
      <div className="space-y-4">
        {nearestStops.map((stop) => {
          const isFav = favorites.includes(stop.BusStopCode);
          return (
            <BusStopCard
              key={stop.BusStopCode}
              stop={stop}
              isFavorite={isFav}
              onToggleFavorite={onToggleFavorite}
              onSelectOnMap={onSelectOnMap}
              onViewRoute={onViewRoute}
              userApiKey={userApiKey}
              refreshTrigger={refreshTrigger}
            />
          );
        })}
      </div>
    </div>
  );
};
