import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Flame, Plus, Minus, Trash2, Settings2, X } from 'lucide-react';
import { addDays, format, isSameDay, subDays } from 'date-fns';
import { bn } from 'date-fns/locale';
import {
  AmalItem, DEFAULT_AMAL, allItems, getDay, saveDay, dayScore, prayerStreak,
  getCustomItems, saveCustomItems, getHidden, saveHidden, QAZA_KEYS, getQaza, saveQaza,
} from '../lib/amal';
import { toBn } from '../lib/hijri';
import { vibrateTap } from '../lib/native';
import { cn } from '../lib/utils';

export default function AmalTracker() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'today' | 'qaza'>('today');
  const [date, setDate] = useState(new Date());
  const [version, setVersion] = useState(0); // localStorage পরিবর্তনের পর re-render এর জন্য
  const [editing, setEditing] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const items = useMemo(() => allItems(), [version]);
  const data = useMemo(() => getDay(date), [date, version]);
  const score = useMemo(() => dayScore(date, items), [date, items, version]);
  const streak = useMemo(() => prayerStreak(), [version]);
  const isToday = isSameDay(date, new Date());

  const groups = useMemo(() => {
    const g: Record<string, AmalItem[]> = {};
    items.forEach((i) => (g[i.group] ||= []).push(i));
    return g;
  }, [items]);

  const week = useMemo(
    () => Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i)).map((d) => ({ d, ...dayScore(d, items) })),
    [items, version],
  );

  const toggle = (id: string) => {
    saveDay(date, { ...data, [id]: !data[id] });
    vibrateTap();
    setVersion((v) => v + 1);
  };

  const addCustom = () => {
    const label = newLabel.trim();
    if (!label) return;
    saveCustomItems([...getCustomItems(), { id: 'c_' + Date.now(), label, group: 'আমার আমল', custom: true }]);
    setNewLabel('');
    setVersion((v) => v + 1);
  };

  const removeItem = (item: AmalItem) => {
    if (item.custom) saveCustomItems(getCustomItems().filter((c) => c.id !== item.id));
    else saveHidden([...getHidden(), item.id]);
    setVersion((v) => v + 1);
  };

  const restoreDefaults = () => {
    saveHidden([]);
    setVersion((v) => v + 1);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f5f5f0] dark:bg-[#0c0c0c] pb-8 transition-colors duration-300">
      <div className="bg-emerald-800 dark:bg-emerald-950 pt-12 pb-6 px-4 rounded-b-[40px] shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="text-white p-2 bg-white/10 rounded-xl -ml-1">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white ml-3">আমল ট্র্যাকার</h1>
          </div>
          {tab === 'today' && (
            <button onClick={() => setEditing((e) => !e)} className="text-white p-2 bg-white/10 rounded-xl">
              {editing ? <X size={18} /> : <Settings2 size={18} />}
            </button>
          )}
        </div>
        <div className="flex bg-white/10 rounded-2xl p-1">
          {(['today', 'qaza'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn('flex-1 py-2 rounded-xl text-sm font-bold transition-colors', tab === t ? 'bg-white text-emerald-800' : 'text-white/80')}
            >
              {t === 'today' ? 'দৈনিক আমল' : 'কাযা হিসাব'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'today' ? (
        <div className="p-4 space-y-5">
          {/* Date + score */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <button onClick={() => setDate(subDays(date, 1))} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-emerald-600">
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <p className="font-bold text-slate-800 dark:text-slate-100">{isToday ? 'আজ' : toBn(format(date, 'EEEE', { locale: bn }))}</p>
                <p className="text-xs text-slate-400">{toBn(format(date, 'd MMMM yyyy', { locale: bn }))}</p>
              </div>
              <button
                disabled={isToday}
                onClick={() => setDate(addDays(date, 1))}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-emerald-600 disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex items-center gap-5 mt-5">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5" className="stroke-slate-100 dark:stroke-slate-800" />
                  <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5" strokeLinecap="round" className="stroke-emerald-500 transition-all"
                    strokeDasharray={`${score.pct} 100`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-400">{toBn(score.pct)}%</span>
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <b>{toBn(score.done)}</b> / {toBn(score.total)} টি আমল সম্পন্ন
                </p>
                <div className="flex items-center text-sm text-orange-600 dark:text-orange-400 font-bold">
                  <Flame size={16} className="mr-1" /> নামাজ স্ট্রিক: {toBn(streak)} দিন
                </div>
              </div>
            </div>

            {/* Last 7 days */}
            <div className="flex items-end justify-between gap-2 mt-5 h-20">
              {week.map((w) => (
                <button key={w.d.toISOString()} onClick={() => setDate(w.d)} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg flex-1 flex items-end overflow-hidden">
                    <div className={cn('w-full rounded-lg', isSameDay(w.d, date) ? 'bg-emerald-600' : 'bg-emerald-300 dark:bg-emerald-700')} style={{ height: `${Math.max(w.pct, 4)}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-400">{format(w.d, 'EEE', { locale: bn })}</span>
                </button>
              ))}
            </div>
          </div>

          {(Object.entries(groups) as [string, AmalItem[]][]).map(([group, list]) => (
            <div key={group}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">{group}</h3>
              <div className="bg-white dark:bg-slate-900 rounded-[28px] p-2 shadow-sm border border-slate-100 dark:border-slate-800">
                {list.map((item, idx) => (
                  <div key={item.id} className={cn('flex items-center', idx !== list.length - 1 && 'border-b border-slate-50 dark:border-slate-800')}>
                    <button onClick={() => !editing && toggle(item.id)} className="flex-1 flex items-center gap-3 p-3 text-left">
                      <span className={cn('w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors',
                        data[item.id] ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600')}>
                        {data[item.id] && <Check size={14} strokeWidth={3} />}
                      </span>
                      <span className={cn('text-[15px] font-medium', data[item.id] ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200')}>{item.label}</span>
                    </button>
                    {editing && (
                      <button onClick={() => removeItem(item)} className="p-3 text-red-500">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {editing && (
            <div className="bg-white dark:bg-slate-900 rounded-[28px] p-4 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">নতুন আমল যোগ করুন</p>
              <div className="flex gap-2">
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                  placeholder="যেমন: সূরা কাহফ (জুমাবার)"
                  className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-100"
                />
                <button onClick={addCustom} className="bg-emerald-600 text-white rounded-xl px-3"><Plus size={18} /></button>
              </div>
              {getHidden().length > 0 && (
                <button onClick={restoreDefaults} className="text-xs text-emerald-600 font-bold">
                  লুকানো {toBn(getHidden().filter((h) => DEFAULT_AMAL.some((d) => d.id === h)).length)}টি ডিফল্ট আমল ফিরিয়ে আনুন
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <QazaCounter />
      )}
    </div>
  );
}

function QazaCounter() {
  const [q, setQ] = useState(getQaza());
  const [bulk, setBulk] = useState('');
  const update = (id: string, delta: number) => {
    const next = { ...q, [id]: Math.max(0, (q[id] || 0) + delta) };
    setQ(next);
    saveQaza(next);
    vibrateTap();
  };
  const total = QAZA_KEYS.filter((k) => k.id !== 'roza').reduce((s, k) => s + (q[k.id] || 0), 0);

  // "এত দিনের নামাজ কাযা" দিলে প্রতিটি ওয়াক্তে (বিতর সহ) ঐ সংখ্যা যোগ হবে
  const addDays = () => {
    const n = parseInt(bulk.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))), 10);
    if (!n || n < 0) return;
    const next = { ...q };
    QAZA_KEYS.filter((k) => k.id !== 'roza').forEach((k) => (next[k.id] = (next[k.id] || 0) + n));
    setQ(next);
    saveQaza(next);
    setBulk('');
  };

  return (
    <div className="p-4 space-y-5">
      <div className="bg-emerald-600 dark:bg-emerald-800 rounded-[28px] p-5 text-white text-center">
        <p className="text-xs opacity-80">মোট বাকি কাযা নামাজ</p>
        <p className="text-4xl font-bold mt-1">{toBn(total)}</p>
        <p className="text-[11px] opacity-70 mt-2">প্রতিবার একটি কাযা আদায় করলে (−) চাপুন</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-2 shadow-sm border border-slate-100 dark:border-slate-800">
        {QAZA_KEYS.map((k, idx) => (
          <div key={k.id} className={cn('flex items-center justify-between p-3', idx !== QAZA_KEYS.length - 1 && 'border-b border-slate-50 dark:border-slate-800')}>
            <span className="font-bold text-slate-700 dark:text-slate-200">{k.label}</span>
            <div className="flex items-center gap-3">
              <button onClick={() => update(k.id, -1)} className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <Minus size={16} />
              </button>
              <span className="w-12 text-center font-bold text-lg text-slate-800 dark:text-slate-100">{toBn(q[k.id] || 0)}</span>
              <button onClick={() => update(k.id, 1)} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-4 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">একসাথে অনেক দিনের কাযা যোগ করুন</p>
        <p className="text-xs text-slate-400">যত দিনের নামাজ কাযা হয়েছে লিখুন — প্রতি ওয়াক্তে (বিতর সহ) ততগুলো যোগ হবে।</p>
        <div className="flex gap-2">
          <input value={bulk} onChange={(e) => setBulk(e.target.value)} inputMode="numeric" placeholder="দিনের সংখ্যা"
            className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-100" />
          <button onClick={addDays} className="bg-emerald-600 text-white rounded-xl px-4 text-sm font-bold">যোগ</button>
        </div>
      </div>
    </div>
  );
}
