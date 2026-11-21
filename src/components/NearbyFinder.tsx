import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Navigation, ExternalLink, RefreshCw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';
import { getLocation, locationErrorBn, LocationError, Place } from '../lib/net';
import { distanceKm, formatDistanceBn } from '../lib/offline';

export type Row = { name: string; sub: string; badge?: string; lat: number; lng: number; km: number };

export async function openInMaps(lat: number, lng: number, name: string) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  if (Capacitor.isNativePlatform()) {
    // প্রথমে Maps অ্যাপে পিন সহ খোলার চেষ্টা, না হলে ব্রাউজারে
    for (const u of [`geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`, url]) {
      try {
        const r = await AppLauncher.openUrl({ url: u });
        if (r.completed) return;
      } catch {}
    }
  }
  window.open(url, '_blank');
}

type Props = {
  title: string;
  subtitle: string;
  listTitle: string;
  loadingText: string;
  emptyText: string;
  fallbackName: string;
  search: (lat: number, lng: number) => Promise<Place[]>;
  toRow?: (p: Place, km: number) => Partial<Row> & { sortKey?: number };
};

export default function NearbyFinder({ title, subtitle, listTitle, loadingText, emptyText, fallbackName, search, toRow }: Props) {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'locating' | 'searching' | 'done' | 'error'>('locating');
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');

  const run = useCallback(async () => {
    setError('');
    setStage('locating');
    let loc: { lat: number; lng: number };
    try {
      loc = await getLocation();
    } catch (e) {
      setError(locationErrorBn(e instanceof LocationError ? e : new LocationError('timeout')));
      setStage('error');
      return;
    }
    setStage('searching');
    try {
      const places = await search(loc.lat, loc.lng);
      const list = places
        .map((p) => {
          const km = distanceKm(loc.lat, loc.lng, p.lat, p.lng);
          const extra = toRow?.(p, km) ?? {};
          const addr = p.tags['addr:full'] || [p.tags['addr:street'], p.tags['addr:suburb'] || p.tags['addr:city']].filter(Boolean).join(', ');
          return {
            row: {
              name: p.name || fallbackName,
              sub: `${formatDistanceBn(km)} দূরে${addr ? ' • ' + addr : ''}`,
              lat: p.lat,
              lng: p.lng,
              km,
              ...extra,
            } as Row,
            sortKey: (extra as any).sortKey ?? 0,
          };
        })
        .sort((a, b) => a.sortKey - b.sortKey || a.row.km - b.row.km)
        .slice(0, 60)
        .map((x) => x.row);
      setRows(list);
      if (!list.length) {
        setError(emptyText);
        setStage('error');
      } else setStage('done');
    } catch (e: any) {
      console.error(e);
      setError(`সার্ভার থেকে তথ্য আনা যায়নি (${e?.message || 'network'})। ইন্টারনেট চেক করে একটু পরে আবার চেষ্টা করুন।`);
      setStage('error');
    }
  }, [search, toRow, emptyText, fallbackName]);

  useEffect(() => {
    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col min-h-full bg-[#f5f5f0] dark:bg-[#0c0c0c] pb-8 transition-colors duration-300">
      <div className="bg-emerald-800 dark:bg-emerald-950 pt-12 pb-6 px-4 rounded-b-[40px] shadow-lg sticky top-0 z-20">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="text-white p-2 bg-white/10 rounded-xl -ml-1">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white ml-3">{title}</h1>
        </div>
        <p className="text-emerald-100 text-sm opacity-80">{subtitle}</p>
      </div>

      <div className="p-4 space-y-4">
        {stage === 'locating' || stage === 'searching' ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">{stage === 'locating' ? 'আপনার লোকেশন নেওয়া হচ্ছে...' : loadingText}</p>
          </div>
        ) : stage === 'error' ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="bg-red-50 dark:bg-red-950/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <MapPin size={32} />
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium leading-relaxed">{error}</p>
            <button onClick={run} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center mx-auto space-x-2 active:scale-95">
              <RefreshCw size={18} />
              <span>আবার চেষ্টা করুন</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{listTitle}</h3>
              <button onClick={run} className="text-emerald-600 p-2">
                <RefreshCw size={16} />
              </button>
            </div>
            {rows.map((r, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">{r.name}</h3>
                    {r.badge && (
                      <span className="inline-block text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full mb-1">{r.badge}</span>
                    )}
                    <div className="flex items-start text-slate-500 dark:text-slate-400 text-sm">
                      <MapPin size={14} className="mr-1.5 mt-0.5 text-emerald-500 shrink-0" />
                      <span className="line-clamp-2">{r.sub}</span>
                    </div>
                  </div>
                  <button onClick={() => openInMaps(r.lat, r.lng, r.name)} className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-2xl text-emerald-600 ml-4">
                    <Navigation size={20} />
                  </button>
                </div>
                <button
                  onClick={() => openInMaps(r.lat, r.lng, r.name)}
                  className="mt-4 w-full py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center space-x-2"
                >
                  <span>ম্যাপে দেখুন</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            ))}
            <p className="text-[10px] text-center text-slate-400">তথ্যসূত্র: OpenStreetMap</p>
          </>
        )}
      </div>
    </div>
  );
}
