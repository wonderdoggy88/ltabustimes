import React, { useState } from 'react';
import { X, Key, RefreshCw, Volume2, Download, Upload, ShieldCheck, ExternalLink, Trash2 } from 'lucide-react';
import { FavoriteStop } from '../types/bus';

interface SettingsModalProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  refreshInterval: number;
  onSaveRefreshInterval: (interval: number) => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  favorites: FavoriteStop[];
  onImportFavorites: (favs: FavoriteStop[]) => void;
  onClearFavorites: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  apiKey,
  onSaveApiKey,
  refreshInterval,
  onSaveRefreshInterval,
  soundEnabled,
  onToggleSound,
  favorites,
  onImportFavorites,
  onClearFavorites,
  onClose,
}) => {
  const [keyInput, setKeyInput] = useState<string>(apiKey);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(keyInput.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportFavorites = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(favorites, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sg-bus-favorites-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportFavorites(parsed);
            alert('Favorites successfully imported!');
          }
        } catch {
          alert('Invalid JSON file format.');
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">App Settings & LTA DataMall</h3>
              <p className="text-xs text-slate-400">Configure data feed, refresh rate, and backups</p>
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* LTA DataMall Account Key */}
          <form onSubmit={handleSave} className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>LTA DataMall Account Key (Optional)</span>
              </label>
              <a
                href="https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Request Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              By default, the app runs on a clock-synchronized high-fidelity real-time simulation engine that mimics exact LTA bus movement and arrival headways. You can also paste your official LTA DataMall AccountKey here for direct government data.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Paste LTA DataMall AccountKey here..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl transition-colors shrink-0"
              >
                {saveSuccess ? 'Saved!' : 'Save'}
              </button>
            </div>
          </form>

          {/* Auto Refresh Interval */}
          <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <label className="font-bold text-white flex items-center gap-1.5 text-xs">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Auto-Refresh Arrival Rate</span>
            </label>
            <p className="text-[11px] text-slate-400">
              Controls how frequently bus stop arrival times and active GPS positions update.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '10 sec', val: 10000 },
                { label: '15 sec', val: 15000 },
                { label: '30 sec', val: 30000 },
                { label: 'Off', val: 0 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => onSaveRefreshInterval(opt.val)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                    refreshInterval === opt.val
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Arrival Sound Notification */}
          <div className="flex items-center justify-between bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <div className="space-y-0.5 pr-4">
              <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Bus Arrival Sound Alert</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Play a gentle audio chime when an alert-monitored bus is 2 minutes away.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleSound(!soundEnabled)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                soundEnabled ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Favorite Stops Backup / Restore */}
          <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <label className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Backup & Restore Saved Favorites ({favorites.length} saved)</span>
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportFavorites}
                disabled={favorites.length === 0}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export JSON</span>
              </button>

              <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Import JSON</span>
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </label>

              {favorites.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all favorite stops?')) {
                      onClearFavorites();
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
