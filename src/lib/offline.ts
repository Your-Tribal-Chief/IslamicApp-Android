import { get, set } from 'idb-keyval';

// কুরআন, হাদিস ও নামাজের সময়ের API response IndexedDB-তে রেখে দেয়।
// ইন্টারনেট না থাকলে আগে একবার খোলা সূরা/হাদিস/নামাজের সময় cache থেকে দেখাবে।
const CACHEABLE = [
  'api.alquran.cloud/v1/surah',
  'raw.githubusercontent.com/fawazahmed0/hadith-api',
  'api.aladhan.com/v1/',
];

export function installOfflineCache() {
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (method !== 'GET' || !CACHEABLE.some((p) => url.includes(p))) return original(input, init);

    const key = 'cache:' + url;
    try {
      const res = await original(input, init);
      if (res.ok) {
        res.clone().text().then((body) => set(key, body).catch(() => {})).catch(() => {});
        return res;
      }
      const cached = await get<string>(key);
      return cached ? new Response(cached, { status: 200, headers: { 'Content-Type': 'application/json' } }) : res;
    } catch (err) {
      const cached = await get<string>(key);
      if (cached) return new Response(cached, { status: 200, headers: { 'Content-Type': 'application/json' } });
      throw err;
    }
  };
}

// দুই স্থানাঙ্কের দূরত্ব (কিলোমিটার)
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatDistanceBn(km: number) {
  const bn = (s: string) => s.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);
  return km < 1 ? bn(`${Math.round(km * 1000)} মিটার`) : bn(`${km.toFixed(1)} কিমি`);
}

// Overpass-এর প্রধান সার্ভার ব্যস্ত থাকলে বিকল্প সার্ভারে চেষ্টা করে
export async function overpass(query: string) {
  const servers = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
  let last: unknown;
  for (const s of servers) {
    try {
      const res = await fetch(`${s}?data=${encodeURIComponent(query)}`);
      if (res.ok) return await res.json();
      last = new Error(`HTTP ${res.status}`);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}
