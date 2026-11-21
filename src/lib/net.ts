import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

// OSM সার্ভারগুলো (Overpass, Nominatim) সাধারণ/অজানা User-Agent পেলে 406/403 দিয়ে request বাতিল করে।
// তাই অ্যাপকে চেনা যায় এমন User-Agent ও Referer পাঠানো হয়।
export const APP_UA = 'IslamicApp-Android/1.2 (+https://github.com/Your-Tribal-Chief/IslamicApp)';
const APP_REFERER = 'https://github.com/Your-Tribal-Chief/IslamicApp';

const isNative = Capacitor.isNativePlatform();

type Req = {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  json?: unknown; // JSON body
  form?: Record<string, string>; // x-www-form-urlencoded body
  timeoutMs?: number;
};

export class HttpError extends Error {
  constructor(public status: number, public body: string) {
    super(`HTTP ${status}`);
  }
}

/** Native-এ CapacitorHttp (CORS নেই, নিজের User-Agent দেওয়া যায়), ওয়েবে সাধারণ fetch */
export async function httpJson<T = any>(req: Req): Promise<T> {
  const method = req.method ?? 'GET';
  const headers: Record<string, string> = { Accept: '*/*', ...req.headers };
  const timeout = req.timeoutMs ?? 30000;

  if (isNative) {
    headers['User-Agent'] = APP_UA;
    headers['Referer'] = APP_REFERER;
    let data: any;
    if (req.json !== undefined) {
      headers['Content-Type'] = 'application/json';
      data = req.json;
    } else if (req.form) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      data = req.form;
    }
    const res = await CapacitorHttp.request({
      url: req.url,
      method,
      headers,
      data,
      connectTimeout: timeout,
      readTimeout: timeout,
      responseType: 'text',
    });
    const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    if (res.status < 200 || res.status >= 300) throw new HttpError(res.status, text.slice(0, 300));
    return JSON.parse(text) as T;
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    let body: BodyInit | undefined;
    if (req.json !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(req.json);
    } else if (req.form) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = new URLSearchParams(req.form).toString();
    }
    const res = await fetch(req.url, { method, headers, body, signal: ctrl.signal });
    const text = await res.text();
    if (!res.ok) throw new HttpError(res.status, text.slice(0, 300));
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(t);
  }
}

export type LocErrorKind = 'denied' | 'off' | 'timeout' | 'unsupported';
export class LocationError extends Error {
  constructor(public kind: LocErrorKind) {
    super(kind);
  }
}

export function locationErrorBn(e: unknown) {
  const kind = e instanceof LocationError ? e.kind : 'timeout';
  return {
    denied: 'লোকেশন পারমিশন দেওয়া হয়নি। ফোনের Settings → Apps → Islamic App → Permissions থেকে Location চালু করুন।',
    off: 'ফোনের লোকেশন (GPS) বন্ধ আছে। নোটিফিকেশন বার থেকে Location চালু করে আবার চেষ্টা করুন।',
    timeout: 'লোকেশন পেতে সময় লাগছে। খোলা জায়গায় গিয়ে বা একটু পর আবার চেষ্টা করুন।',
    unsupported: 'এই ডিভাইসে লোকেশন সাপোর্ট করে না।',
  }[kind];
}

/** ফোনের নেটিভ লোকেশন (পারমিশন চাওয়া সহ)। প্রথমে দ্রুত/কম-নির্ভুল, না পেলে GPS দিয়ে চেষ্টা করে। */
export async function getLocation(): Promise<{ lat: number; lng: number }> {
  if (isNative) {
    let perm = await Geolocation.checkPermissions().catch(() => null);
    if (!perm || (perm.location !== 'granted' && perm.coarseLocation !== 'granted')) {
      try {
        perm = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
      } catch (e: any) {
        // ফোনের লোকেশন সার্ভিস বন্ধ থাকলে plugin এখানেই error দেয়
        if (String(e?.message || e).toLowerCase().includes('disabled')) throw new LocationError('off');
        throw new LocationError('denied');
      }
      if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') throw new LocationError('denied');
    }
    const attempt = async (high: boolean) => {
      const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: high, timeout: high ? 20000 : 10000, maximumAge: 10 * 60 * 1000 });
      return { lat: p.coords.latitude, lng: p.coords.longitude };
    };
    try {
      return await attempt(false);
    } catch (e: any) {
      const msg = String(e?.message || e).toLowerCase();
      if (msg.includes('disabled') || msg.includes('not enabled')) throw new LocationError('off');
      if (msg.includes('denied')) throw new LocationError('denied');
      try {
        return await attempt(true);
      } catch (e2: any) {
        const m2 = String(e2?.message || e2).toLowerCase();
        if (m2.includes('disabled') || m2.includes('not enabled')) throw new LocationError('off');
        throw new LocationError('timeout');
      }
    }
  }

  if (!navigator.geolocation) throw new LocationError('unsupported');
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => reject(new LocationError(err.code === 1 ? 'denied' : err.code === 2 ? 'off' : 'timeout')),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 },
    ),
  );
}

export type Place = { name: string; lat: number; lng: number; tags: Record<string, string> };

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

async function overpassPlaces(query: string): Promise<Place[]> {
  let last: unknown;
  for (const url of OVERPASS_SERVERS) {
    try {
      const data = await httpJson<any>({ url, method: 'POST', form: { data: query }, timeoutMs: 25000 });
      if (!Array.isArray(data?.elements)) throw new Error('bad response');
      return data.elements
        .map((el: any) => ({
          name: el.tags?.name || el.tags?.['name:bn'] || el.tags?.['name:en'] || '',
          lat: el.lat ?? el.center?.lat,
          lng: el.lon ?? el.center?.lon,
          tags: el.tags || {},
        }))
        .filter((p: Place) => typeof p.lat === 'number' && typeof p.lng === 'number');
    } catch (e) {
      last = e;
    }
  }
  throw last ?? new Error('overpass failed');
}

// Overpass সব সার্ভার ব্যর্থ হলে Nominatim (OSM-এর search) দিয়ে খোঁজা হয়
async function nominatimPlaces(terms: string[], lat: number, lng: number, km: number): Promise<Place[]> {
  const d = km / 111;
  const viewbox = [lng - d, lat + d, lng + d, lat - d].join(',');
  const results: Place[] = [];
  let failures = 0;
  let lastErr: unknown;
  for (const q of terms) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=50&bounded=1&viewbox=${viewbox}&q=${encodeURIComponent(q)}&accept-language=bn,en`;
    let list: any[] = [];
    try {
      list = await httpJson<any[]>({ url, timeoutMs: 20000 });
    } catch (e) {
      failures++;
      lastErr = e;
    }
    for (const r of list) {
      results.push({
        name: r.name || r.display_name?.split(',')[0] || '',
        lat: +r.lat,
        lng: +r.lon,
        tags: { ...(r.extratags || {}), 'addr:full': r.display_name?.split(',').slice(1, 3).join(',').trim() || '' },
      });
    }
  }
  if (failures === terms.length) throw lastErr ?? new Error('network');
  const seen = new Set<string>();
  return results.filter((p) => {
    const k = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export async function findMosques(lat: number, lng: number): Promise<Place[]> {
  const r = 3000;
  const q = `[out:json][timeout:25];(node["amenity"="place_of_worship"]["religion"="muslim"](around:${r},${lat},${lng});way["amenity"="place_of_worship"]["religion"="muslim"](around:${r},${lat},${lng});node["building"="mosque"](around:${r},${lat},${lng});way["building"="mosque"](around:${r},${lat},${lng}););out center 150;`;
  try {
    const list = await overpassPlaces(q);
    if (list.length) return list;
  } catch {}
  return nominatimPlaces(['mosque', 'মসজিদ'], lat, lng, 3);
}

export async function findRestaurants(lat: number, lng: number): Promise<Place[]> {
  const r = 3000;
  const q = `[out:json][timeout:25];(node["amenity"~"^(restaurant|fast_food|food_court)$"](around:${r},${lat},${lng});way["amenity"~"^(restaurant|fast_food|food_court)$"](around:${r},${lat},${lng}););out center 200;`;
  try {
    const list = await overpassPlaces(q);
    if (list.length) return list;
  } catch {}
  return nominatimPlaces(['restaurant', 'halal restaurant'], lat, lng, 3);
}
