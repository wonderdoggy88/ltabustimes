import React from 'react';
import { BusServiceRoute, BusStop } from '../types/bus';
import { POPULAR_ROUTES, SINGAPORE_BUS_STOPS } from '../data/singaporeBuses';
import { X, Route, Bus, MapPin, ChevronRight, ArrowRight } from 'lucide-react';

interface BusRouteModalProps {
  serviceNo: string;
  onClose: () => void;
  onSelectStop: (stop: BusStop) => void;
}

export const BusRouteModal: React.FC<BusRouteModalProps> = ({
  serviceNo,
  onClose,
  onSelectStop,
}) => {
  const route: BusServiceRoute | undefined = POPULAR_ROUTES[serviceNo];

  // If route is not in predefined popular corridors, generate standard sequence from stops serving this bus
  const stopsServingService: BusStop[] = SINGAPORE_BUS_STOPS.filter((s) =>
    s.services.includes(serviceNo)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="min-w-[50px] px-3 py-1.5 text-2xl font-black text-white bg-slate-800 rounded-xl border border-slate-700 font-mono text-center shadow-inner">
              {serviceNo}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Bus Service Route</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                  {route?.Operator || 'LTA Service'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>{route ? route.Origin : 'Interchange'}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span>{route ? route.Destination : 'Terminus'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline of Stops */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="text-xs text-slate-400 flex items-center justify-between px-1">
            <span>Route Sequence & Bus Stop Points</span>
            <span>Tap any stop to inspect live arrivals</span>
          </div>

          {route ? (
            <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-500/40">
              {route.Stops.map((stop, idx) => (
                <div
                  key={stop.BusStopCode}
                  onClick={() => {
                    const fullStop = SINGAPORE_BUS_STOPS.find(
                      (s) => s.BusStopCode === stop.BusStopCode
                    );
                    if (fullStop) {
                      onSelectStop(fullStop);
                      onClose();
                    }
                  }}
                  className="group relative flex items-start justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-700/60 transition-all cursor-pointer shadow-sm"
                >
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-[19px] top-4 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-emerald-400 group-hover:scale-125 transition-transform" />

                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                        {stop.BusStopCode}
                      </span>
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                        {stop.Description}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{stop.RoadName}</p>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500">{stop.Distance} km</span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : stopsServingService.length > 0 ? (
            <div className="space-y-2">
              {stopsServingService.map((stop) => (
                <div
                  key={stop.BusStopCode}
                  onClick={() => {
                    onSelectStop(stop);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-700/60 transition-all cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                        {stop.BusStopCode}
                      </span>
                      <span className="text-xs font-bold text-white">{stop.Description}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{stop.RoadName}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <p className="text-xs">Route sequence details are being mapped by LTA DataMall.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
