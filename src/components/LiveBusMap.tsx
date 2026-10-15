import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BusStop, ActiveLiveBus } from '../types/bus';
import { SINGAPORE_BUS_STOPS, POPULAR_ROUTES } from '../data/singaporeBuses';
import { fetchBusArrivals, getActiveBusesForStop } from '../services/ltaService';
import {
  Compass,
  Navigation,
  Layers,
  MapPin,
  RefreshCw,
  X,
  Bus,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface LiveBusMapProps {
  selectedStop?: BusStop;
  selectedServiceNo?: string;
  userLocation?: { lat: number; lng: number } | null;
  onSelectStop: (stop: BusStop) => void;
  onClose?: () => void;
  userApiKey?: string;
}

export const LiveBusMap: React.FC<LiveBusMapProps> = ({
  selectedStop,
  selectedServiceNo,
  userLocation,
  onSelectStop,
  onClose,
  userApiKey,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const busMarkersRef = useRef<L.Marker[]>([]);
  const stopMarkersRef = useRef<L.Marker[]>([]);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [activeBuses, setActiveBuses] = useState<ActiveLiveBus[]>([]);
  const [mapStyle, setMapStyle] = useState<'dark' | 'light'>('dark');
  const [showAllStops, setShowAllStops] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [autoTracking, setAutoTracking] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Tile layers
  const tileLayers = {
    dark: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = selectedStop ? selectedStop.Latitude : 1.30076;
    const initialLng = selectedStop ? selectedStop.Longitude : 103.83907;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer(tileLayers[mapStyle], {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map tile layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });
    L.tileLayer(tileLayers[mapStyle], {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
  }, [mapStyle]);

  // Fetch live buses for current selected stop
  const fetchLiveBuses = async () => {
    if (!selectedStop) return;
    try {
      const res = await fetchBusArrivals(selectedStop.BusStopCode, userApiKey);
      let buses = getActiveBusesForStop(selectedStop, res.arrivals);
      if (selectedServiceNo) {
        buses = buses.filter((b) => b.serviceNo === selectedServiceNo);
      }
      setActiveBuses(buses);
      setLastRefreshed(new Date());
    } catch {
      // ignore
    }
  };

  // Poll live buses every 6 seconds for smooth progress
  useEffect(() => {
    fetchLiveBuses();
    const interval = setInterval(fetchLiveBuses, 6000);
    return () => clearInterval(interval);
  }, [selectedStop?.BusStopCode, selectedServiceNo]);

  // Render Stop Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing stop markers
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    const stopsToRender = showAllStops
      ? SINGAPORE_BUS_STOPS
      : selectedStop
      ? [selectedStop]
      : SINGAPORE_BUS_STOPS;

    stopsToRender.forEach((stop) => {
      const isSelected = selectedStop?.BusStopCode === stop.BusStopCode;

      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div style="
            width: ${isSelected ? '28px' : '18px'};
            height: ${isSelected ? '28px' : '18px'};
            background: ${isSelected ? '#10b981' : '#0284c7'};
            border: 2px solid #ffffff;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <div style="
              width: ${isSelected ? '10px' : '6px'};
              height: ${isSelected ? '10px' : '6px'};
              background: #ffffff;
              border-radius: 9999px;
            "></div>
          </div>
        `,
        iconSize: [isSelected ? 28 : 18, isSelected ? 28 : 18],
        iconAnchor: [isSelected ? 14 : 9, isSelected ? 14 : 9],
      });

      const marker = L.marker([stop.Latitude, stop.Longitude], { icon: stopIcon }).addTo(map);

      marker.on('click', () => {
        onSelectStop(stop);
      });

      const popupHtml = `
        <div style="padding: 12px; min-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="background: #10b981; color: #022c22; font-family: monospace; font-weight: bold; font-size: 11px; padding: 2px 6px; border-radius: 4px;">
              ${stop.BusStopCode}
            </span>
            <span style="font-size: 11px; color: #94a3b8;">${stop.region || 'Singapore'}</span>
          </div>
          <div style="font-weight: 700; font-size: 14px; color: #f8fafc; margin-bottom: 2px;">
            ${stop.Description}
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
            ${stop.RoadName}
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${stop.services
              .slice(0, 8)
              .map(
                (s) =>
                  `<span style="background: #334155; color: #e2e8f0; font-size: 10px; font-weight: bold; padding: 1px 5px; border-radius: 4px;">${s}</span>`
              )
              .join('')}
            ${stop.services.length > 8 ? `<span style="font-size: 10px; color: #94a3b8;">+${stop.services.length - 8}</span>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      stopMarkersRef.current.push(marker);
    });
  }, [showAllStops, selectedStop]);

  // Render User Location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="
            width: 22px;
            height: 22px;
            background: #3b82f6;
            border: 3px solid #ffffff;
            border-radius: 9999px;
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.35);
          "></div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
    }
  }, [userLocation]);

  // Render Live Buses
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    busMarkersRef.current.forEach((m) => m.remove());
    busMarkersRef.current = [];

    activeBuses.forEach((bus) => {
      const loadColor =
        bus.load === 'SEA' ? '#10b981' : bus.load === 'SDA' ? '#f59e0b' : '#ef4444';
      const isUrgent = bus.minutesAway <= 1;

      const busIcon = L.divIcon({
        className: 'custom-live-bus-marker',
        html: `
          <div style="
            position: relative;
            background: #0f172a;
            border: 2px solid ${loadColor};
            border-radius: 8px;
            padding: 3px 6px;
            color: #ffffff;
            font-family: monospace;
            font-weight: 800;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            white-space: nowrap;
          ">
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 9999px;
              background: ${loadColor};
              display: inline-block;
            "></span>
            <span>${bus.serviceNo}</span>
            <span style="font-size: 10px; color: #a7f3d0; background: #064e3b; padding: 0 3px; border-radius: 3px;">
              ${bus.minutesAway <= 0 ? 'ARR' : `${bus.minutesAway}m`}
            </span>
            ${
              isUrgent
                ? `<span style="
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    width: 8px;
                    height: 8px;
                    background: #10b981;
                    border-radius: 9999px;
                    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
                  "></span>`
                : ''
            }
          </div>
        `,
        iconSize: [64, 28],
        iconAnchor: [32, 14],
      });

      const marker = L.marker([bus.latitude, bus.longitude], { icon: busIcon }).addTo(map);

      const loadText =
        bus.load === 'SEA'
          ? 'Seats Available (SEA)'
          : bus.load === 'SDA'
          ? 'Standing Available (SDA)'
          : 'Limited Standing (LSD)';

      const popupHtml = `
        <div style="padding: 12px; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="background: #0f172a; color: #ffffff; border: 1px solid #334155; font-family: monospace; font-size: 14px; font-weight: 800; padding: 2px 8px; border-radius: 6px;">
              BUS ${bus.serviceNo}
            </span>
            <span style="font-size: 11px; font-weight: bold; color: ${loadColor};">
              ${bus.minutesAway <= 0 ? 'ARRIVING NOW' : `${bus.minutesAway} MINS AWAY`}
            </span>
          </div>

          <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 6px; line-height: 1.5;">
            <div><strong>Operator:</strong> ${bus.operator}</div>
            <div><strong>Deck:</strong> ${bus.type === 'DD' ? 'Double Deck' : bus.type === 'BD' ? 'Bendy' : 'Single Deck'}</div>
            <div><strong>Load:</strong> <span style="color: ${loadColor}; font-weight: 600;">${loadText}</span></div>
            <div><strong>Estimated Distance:</strong> ${bus.distanceKm} km away</div>
            <div><strong>Speed:</strong> ~${bus.speedKmH} km/h</div>
          </div>

          <div style="font-size: 10px; color: #94a3b8; border-top: 1px solid #334155; padding-top: 6px;">
            Heading towards stop: <strong>${selectedStop?.Description || bus.targetStopCode}</strong>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      busMarkersRef.current.push(marker);
    });
  }, [activeBuses, selectedStop]);

  // Draw Route Polyline if service is chosen or stop has route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (selectedServiceNo && POPULAR_ROUTES[selectedServiceNo]) {
      const route = POPULAR_ROUTES[selectedServiceNo];
      const latlngs: [number, number][] = route.Stops.map((s) => [s.Latitude, s.Longitude]);

      const poly = L.polyline(latlngs, {
        color: '#10b981',
        weight: 4,
        opacity: 0.8,
        dashArray: '6, 8',
      }).addTo(map);

      routePolylineRef.current = poly;
    }
  }, [selectedServiceNo]);

  // Recenter when selectedStop changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStop) return;

    if (autoTracking) {
      map.flyTo([selectedStop.Latitude, selectedStop.Longitude], 16, {
        duration: 1.2,
      });
    }
  }, [selectedStop?.BusStopCode]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (selectedStop) {
      map.flyTo([selectedStop.Latitude, selectedStop.Longitude], 16);
    } else if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 15);
    } else {
      map.flyTo([1.3521, 103.8198], 12);
    }
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col ${
        isFullscreen ? 'fixed inset-4 z-50' : 'h-[500px] w-full'
      }`}
    >
      {/* Top Map Header Overlay */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between pointer-events-none gap-2">
        {/* Left: Active Stop & Service Info */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 shadow-lg flex items-center gap-2.5 max-w-[70%]">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
            <Bus className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">
                {selectedStop ? selectedStop.Description : 'Singapore Bus Network'}
              </span>
              {selectedServiceNo && (
                <span className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                  Bus {selectedServiceNo}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {selectedStop
                ? `${selectedStop.RoadName} • Code ${selectedStop.BusStopCode}`
                : 'Click any bus stop to view real-time arrivals'}
            </p>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {/* Refresh Pulse */}
          <button
            type="button"
            onClick={fetchLiveBuses}
            className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-slate-300 hover:text-white shadow-lg transition-colors"
            title="Refresh GPS positions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Toggle Layer Style */}
          <button
            type="button"
            onClick={() => setMapStyle(mapStyle === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-slate-300 hover:text-white shadow-lg transition-colors"
            title="Toggle Map Style"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-slate-300 hover:text-white shadow-lg transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close button if modal */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-950/80 backdrop-blur-md border border-rose-800/80 text-rose-300 hover:text-rose-100 shadow-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Bottom Floating Status Bar */}
      <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-2">
        <button
          type="button"
          onClick={handleRecenter}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs font-semibold text-slate-200 hover:text-emerald-400 shadow-lg inline-flex items-center gap-1.5 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Recenter</span>
        </button>

        <button
          type="button"
          onClick={() => setShowAllStops(!showAllStops)}
          className={`px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-semibold shadow-lg inline-flex items-center gap-1.5 transition-colors ${
            showAllStops
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80'
              : 'bg-slate-900/90 text-slate-300 border-slate-700'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{showAllStops ? 'All Stops Visible' : 'Selected Stop Only'}</span>
        </button>

        {activeBuses.length > 0 && (
          <div className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Tracking <strong>{activeBuses.length}</strong> active{' '}
              {activeBuses.length === 1 ? 'bus' : 'buses'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
