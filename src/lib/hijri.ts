// ডিভাইসেই হিজরি তারিখ হিসাব (Umm al-Qura)। বাংলাদেশে চাঁদ দেখার উপর নির্ভর করে ±১ দিন হতে পারে।
export const HIJRI_MONTHS_BN = [
  'মহররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জমাদিউল আউয়াল', 'জমাদিউস সানি',
  'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ',
];

let fmt: Intl.DateTimeFormat | null = null;
function formatter() {
  if (fmt) return fmt;
  for (const cal of ['islamic-umalqura', 'islamic-civil', 'islamic']) {
    try {
      fmt = new Intl.DateTimeFormat(`en-u-ca-${cal}-nu-latn`, { day: 'numeric', month: 'numeric', year: 'numeric' });
      return fmt;
    } catch {}
  }
  throw new Error('Hijri calendar not supported');
}

export function hijriAdjustment(): number {
  return Number(localStorage.getItem('hijriAdjust') || '-1'); // বাংলাদেশে সাধারণত সৌদির চেয়ে ১ দিন পিছিয়ে
}

export function toHijri(date: Date, adjust = hijriAdjustment()) {
  const d = new Date(date);
  d.setDate(d.getDate() + adjust);
  const parts = formatter().formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { day: get('day'), month: get('month'), year: get('year') };
}

export const ISLAMIC_EVENTS: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: 'হিজরি নববর্ষ' },
  { month: 1, day: 10, name: 'আশুরা' },
  { month: 3, day: 12, name: 'ঈদে মিলাদুন্নবী (সা.)' },
  { month: 7, day: 27, name: 'শবে মেরাজ' },
  { month: 8, day: 15, name: 'শবে বরাত' },
  { month: 9, day: 1, name: 'রমজান শুরু' },
  { month: 9, day: 27, name: 'শবে কদর (সম্ভাব্য)' },
  { month: 10, day: 1, name: 'ঈদুল ফিতর' },
  { month: 12, day: 9, name: 'আরাফার দিন' },
  { month: 12, day: 10, name: 'ঈদুল আযহা' },
];

export function eventsInMonth(year: number, month: number) {
  const out: { date: Date; name: string; hijri: string }[] = [];
  const days = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    const h = toHijri(date);
    const ev = ISLAMIC_EVENTS.find((e) => e.month === h.month && e.day === h.day);
    if (ev) out.push({ date, name: ev.name, hijri: `${toBn(h.day)} ${HIJRI_MONTHS_BN[h.month - 1]}` });
  }
  return out;
}

export function nextEvent(from = new Date()) {
  for (let i = 0; i < 400; i++) {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const h = toHijri(date);
    const ev = ISLAMIC_EVENTS.find((e) => e.month === h.month && e.day === h.day);
    if (ev) return { date, name: ev.name, daysLeft: i };
  }
  return null;
}

export const toBn = (n: number | string) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);
