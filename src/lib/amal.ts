import { format, subDays } from 'date-fns';

export type AmalItem = { id: string; label: string; group: string; custom?: boolean };

export const FARD_IDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const DEFAULT_AMAL: AmalItem[] = [
  { id: 'fajr', label: 'ফজর', group: 'ফরজ নামাজ' },
  { id: 'dhuhr', label: 'যোহর / জুমা', group: 'ফরজ নামাজ' },
  { id: 'asr', label: 'আসর', group: 'ফরজ নামাজ' },
  { id: 'maghrib', label: 'মাগরিব', group: 'ফরজ নামাজ' },
  { id: 'isha', label: 'এশা', group: 'ফরজ নামাজ' },
  { id: 'jamaat', label: 'অন্তত এক ওয়াক্ত জামাতে', group: 'ফরজ নামাজ' },

  { id: 'witr', label: 'বিতর (ওয়াজিব)', group: 'সুন্নত ও নফল' },
  { id: 'sunnah', label: 'সুন্নতে মুয়াক্কাদা (১২ রাকাত)', group: 'সুন্নত ও নফল' },
  { id: 'tahajjud', label: 'তাহাজ্জুদ', group: 'সুন্নত ও নফল' },
  { id: 'duha', label: 'ইশরাক / চাশত', group: 'সুন্নত ও নফল' },

  { id: 'quran', label: 'কুরআন তিলাওয়াত', group: 'কুরআন ও জিকির' },
  { id: 'morning', label: 'সকালের জিকির', group: 'কুরআন ও জিকির' },
  { id: 'evening', label: 'সন্ধ্যার জিকির', group: 'কুরআন ও জিকির' },
  { id: 'istighfar', label: 'ইস্তিগফার ১০০ বার', group: 'কুরআন ও জিকির' },
  { id: 'durood', label: 'দরুদ শরীফ', group: 'কুরআন ও জিকির' },
  { id: 'kursi', label: 'প্রতি নামাজের পর আয়াতুল কুরসি', group: 'কুরআন ও জিকির' },
  { id: 'mulk', label: 'ঘুমের আগে সূরা মুলক', group: 'কুরআন ও জিকির' },

  { id: 'sadaqah', label: 'সদকা / দান', group: 'অন্যান্য আমল' },
  { id: 'parents', label: 'বাবা-মায়ের খেদমত', group: 'অন্যান্য আমল' },
  { id: 'fast', label: 'রোজা (ফরজ/নফল)', group: 'অন্যান্য আমল' },
  { id: 'learn', label: 'দ্বীনি জ্ঞান অর্জন', group: 'অন্যান্য আমল' },
];

export const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getCustomItems(): AmalItem[] {
  return read<AmalItem[]>('amal:custom', []);
}
export function saveCustomItems(items: AmalItem[]) {
  localStorage.setItem('amal:custom', JSON.stringify(items));
}
export function getHidden(): string[] {
  return read<string[]>('amal:hidden', []);
}
export function saveHidden(ids: string[]) {
  localStorage.setItem('amal:hidden', JSON.stringify(ids));
}

export function allItems(): AmalItem[] {
  const hidden = getHidden();
  return [...DEFAULT_AMAL, ...getCustomItems()].filter((i) => !hidden.includes(i.id));
}

export function getDay(d: Date): Record<string, boolean> {
  return read<Record<string, boolean>>('amal:' + dayKey(d), {});
}
export function saveDay(d: Date, data: Record<string, boolean>) {
  localStorage.setItem('amal:' + dayKey(d), JSON.stringify(data));
}

export function dayScore(d: Date, items = allItems()) {
  const data = getDay(d);
  const done = items.filter((i) => data[i.id]).length;
  return { done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
}

// পরপর কত দিন পাঁচ ওয়াক্ত নামাজ পড়া হয়েছে (আজ এখনো শেষ না হলে গতকাল থেকে গোনা হয়)
export function prayerStreak(today = new Date()) {
  const full = (d: Date) => {
    const data = getDay(d);
    return FARD_IDS.every((id) => data[id]);
  };
  let streak = 0;
  let d = full(today) ? today : subDays(today, 1);
  while (full(d) && streak < 3650) {
    streak++;
    d = subDays(d, 1);
  }
  return streak;
}

export const QAZA_KEYS = [
  { id: 'fajr', label: 'ফজর' },
  { id: 'dhuhr', label: 'যোহর' },
  { id: 'asr', label: 'আসর' },
  { id: 'maghrib', label: 'মাগরিব' },
  { id: 'isha', label: 'এশা' },
  { id: 'witr', label: 'বিতর' },
  { id: 'roza', label: 'রোজা' },
];
export function getQaza(): Record<string, number> {
  return read<Record<string, number>>('qaza', {});
}
export function saveQaza(q: Record<string, number>) {
  localStorage.setItem('qaza', JSON.stringify(q));
}
