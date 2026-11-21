import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

// APK-তে কোনো backend server নেই, তাই আগের /api/* serverless function গুলোর কাজ এখানে সরাসরি করা হচ্ছে।
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;
// Groq আগস্ট ২০২৬-এ llama-3.x বন্ধ করেছে; একটা model fail করলে পরেরটা চেষ্টা করবে
const GROQ_MODELS = ['openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'openai/gpt-oss-20b'];

const SYSTEM_PROMPT =
  'You are a wise and compassionate Islamic scholar (Mawlana/Hujur). Your goal is to provide halal advice and solutions based on the Quran and Hadith. Always answer in Bengali. Be respectful, empathetic, and provide references where possible.';

export async function askHujur(messages: { role: string; content: string }[]): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('Groq API key missing');
  const chat = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
  ];
  let lastErr: unknown;
  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({ model, temperature: 0.6, max_tokens: 2048, messages: chat }),
      });
      if (res.status === 401) throw new Error('Invalid Groq API key');
      if (!res.ok) { lastErr = new Error(`Groq ${model} error ${res.status}`); continue; }
      const data = await res.json();
      const text: string = data?.choices?.[0]?.message?.content ?? '';
      if (text.trim()) return text;
    } catch (e) {
      lastErr = e;
      if (e instanceof Error && e.message.includes('Invalid')) throw e;
    }
  }
  throw lastErr ?? new Error('No reply');
}

export async function fetchMetalPrices(): Promise<{ gold: number; silver: number }> {
  const [g, s] = await Promise.all([
    fetch('https://api.gold-api.com/price/XAU'),
    fetch('https://api.gold-api.com/price/XAG'),
  ]);
  if (!g.ok || !s.ok) throw new Error('Price API failed');
  const gold = await g.json();
  const silver = await s.json();
  return { gold: gold.price, silver: silver.price };
}

export const isNative = Capacitor.isNativePlatform();

export async function vibrateTap() {
  if (isNative) return Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  navigator.vibrate?.(40);
}

export async function vibrateDone() {
  if (isNative) return Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  navigator.vibrate?.([100, 50, 100]);
}

export async function requestNotifyPermission(): Promise<boolean> {
  if (isNative) {
    const p = await LocalNotifications.requestPermissions();
    return p.display === 'granted';
  }
  if ('Notification' in window) return (await Notification.requestPermission()) === 'granted';
  return false;
}

const PRAYER_NAMES: Record<string, string> = {
  Fajr: 'ফজর',
  Dhuhr: 'যোহর',
  Asr: 'আসর',
  Maghrib: 'মাগরিব',
  Isha: 'এশা',
};

// আজকের (এবং যেগুলো পার হয়ে গেছে সেগুলোর জন্য আগামীকালের) নামাজের সময় local notification schedule করে।
export async function schedulePrayerNotifications(timings: Record<string, string>) {
  if (!isNative) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });

    const now = new Date();
    const notifications = Object.entries(PRAYER_NAMES).flatMap(([key, bn], i) => {
      const raw = timings[key];
      if (!raw) return [];
      const [h, m] = raw.split(' ')[0].split(':').map(Number);
      const at = new Date();
      at.setHours(h, m, 0, 0);
      if (at <= now) at.setDate(at.getDate() + 1);
      return [{
        id: 100 + i,
        title: 'ইসলামিক অ্যাপ',
        body: `${bn} নামাজের ওয়াক্ত শুরু হয়েছে`,
        schedule: { at, allowWhileIdle: true },
        channelId: 'prayer',
      }];
    });

    await LocalNotifications.createChannel({ id: 'prayer', name: 'নামাজের সময়', importance: 5, vibration: true }).catch(() => {});
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  } catch (e) {
    console.error('Notification schedule failed', e);
  }
}

export async function cancelPrayerNotifications() {
  if (!isNative) return;
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
}

export async function showNow(body: string) {
  if (isNative) {
    await LocalNotifications.schedule({
      notifications: [{ id: Math.floor(Math.random() * 100000) + 1000, title: 'ইসলামিক অ্যাপ', body, channelId: 'prayer' }],
    }).catch(() => {});
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('ইসলামিক অ্যাপ', { body });
  }
}
