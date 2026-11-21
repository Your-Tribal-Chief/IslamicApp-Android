import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

// হানাফি মাযহাব অনুযায়ী (বাংলাদেশে প্রচলিত)
const RAKAT = [
  { name: 'ফজর', parts: [['সুন্নাতে মুয়াক্কাদা', 2], ['ফরজ', 2]] },
  { name: 'যোহর', parts: [['সুন্নাতে মুয়াক্কাদা', 4], ['ফরজ', 4], ['সুন্নাতে মুয়াক্কাদা', 2], ['নফল', 2]] },
  { name: 'আসর', parts: [['সুন্নাতে গায়রে মুয়াক্কাদা', 4], ['ফরজ', 4]] },
  { name: 'মাগরিব', parts: [['ফরজ', 3], ['সুন্নাতে মুয়াক্কাদা', 2], ['নফল', 2]] },
  { name: 'এশা', parts: [['সুন্নাতে গায়রে মুয়াক্কাদা', 4], ['ফরজ', 4], ['সুন্নাতে মুয়াক্কাদা', 2], ['নফল', 2], ['বিতর (ওয়াজিব)', 3], ['নফল', 2]] },
  { name: 'জুমা', parts: [['কাবলাল জুমা সুন্নত', 4], ['ফরজ', 2], ['বা‘দাল জুমা সুন্নত', 4], ['সুন্নত', 2]] },
] as const;

const SECTIONS = [
  {
    title: 'অজুর ফরজ ও নিয়ম',
    items: [
      'অজুর ফরজ ৪টি: (১) সম্পূর্ণ মুখমণ্ডল ধোয়া, (২) দুই হাত কনুইসহ ধোয়া, (৩) মাথার এক-চতুর্থাংশ মাসেহ করা, (৪) দুই পা টাখনুসহ ধোয়া।',
      'নিয়ত করে "বিসমিল্লাহ" বলে শুরু করুন।',
      'দুই হাত কবজি পর্যন্ত ৩ বার ধুয়ে নিন।',
      'তিনবার কুলি করুন এবং তিনবার নাকে পানি দিয়ে পরিষ্কার করুন।',
      'পুরো মুখমণ্ডল ৩ বার ধুয়ে নিন (কপালের চুলের গোড়া থেকে থুতনির নিচ পর্যন্ত, এক কান থেকে অন্য কান পর্যন্ত)।',
      'প্রথমে ডান হাত, তারপর বাম হাত কনুইসহ ৩ বার ধোবেন।',
      'পুরো মাথা মাসেহ করুন, সাথে কান ও ঘাড় মাসেহ করুন।',
      'প্রথমে ডান পা, তারপর বাম পা টাখনুসহ ৩ বার ধোবেন; আঙুলের ফাঁক খিলাল করুন।',
    ],
  },
  {
    title: 'নামাজের ফরজ (১৩টি)',
    items: [
      'নামাজের বাইরের ৭টি (আহকাম): শরীর পাক, কাপড় পাক, জায়গা পাক, সতর ঢাকা, কিবলামুখী হওয়া, ওয়াক্ত হওয়া, নিয়ত করা।',
      'নামাজের ভিতরের ৬টি (আরকান): তাকবীরে তাহরীমা, কিয়াম (দাঁড়ানো), কিরাত পড়া, রুকু, দুই সিজদা, শেষ বৈঠক।',
    ],
  },
  {
    title: 'নামাজ পড়ার ধাপ (সংক্ষেপে)',
    items: [
      'কিবলামুখী হয়ে মনে মনে নিয়ত করুন এবং "আল্লাহু আকবার" বলে তাকবীরে তাহরীমা দিন।',
      'হাত বেঁধে সানা পড়ুন: "সুবহানাকাল্লাহুম্মা ওয়া বিহামদিকা ওয়া তাবারাকাসমুকা ওয়া তা‘আলা জাদ্দুকা ওয়া লা ইলাহা গাইরুক।"',
      'আউযুবিল্লাহ ও বিসমিল্লাহ পড়ে সূরা ফাতিহা পড়ুন, তারপর অন্য একটি সূরা বা কমপক্ষে ৩টি ছোট আয়াত পড়ুন।',
      '"আল্লাহু আকবার" বলে রুকুতে যান, ৩ বার "সুবহানা রাব্বিয়াল আযীম" পড়ুন।',
      '"সামি‘আল্লাহু লিমান হামিদাহ" বলে সোজা দাঁড়ান, "রাব্বানা লাকাল হামদ" বলুন।',
      '"আল্লাহু আকবার" বলে সিজদায় যান, ৩ বার "সুবহানা রাব্বিয়াল আ‘লা" পড়ুন; একটু বসে আবার দ্বিতীয় সিজদা করুন।',
      'দ্বিতীয় রাকাত একইভাবে পড়ে বৈঠকে আত্তাহিয়্যাতু পড়ুন। ২ রাকাতের নামাজ হলে দরুদ ও দোয়া মাসূরা পড়ে সালাম ফেরান।',
      '৩ বা ৪ রাকাতের নামাজে প্রথম বৈঠকে শুধু আত্তাহিয়্যাতু পড়ে দাঁড়িয়ে যান; ফরজের শেষ রাকাতগুলোতে শুধু সূরা ফাতিহা পড়ুন।',
      'শেষ বৈঠকে আত্তাহিয়্যাতু, দরুদে ইব্রাহিম ও দোয়া মাসূরা পড়ে প্রথমে ডানে, পরে বামে "আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ" বলে সালাম ফেরান।',
    ],
  },
  {
    title: 'নামাজের নিষিদ্ধ সময়',
    items: [
      'সূর্যোদয়ের সময় থেকে সূর্য কিছুটা উপরে ওঠা পর্যন্ত (প্রায় ১৫–২০ মিনিট)।',
      'ঠিক দুপুরে সূর্য মাথার উপর থাকার সময় (যাওয়াল)।',
      'সূর্যাস্তের সময় (সূর্য হলুদ হয়ে যাওয়া থেকে অস্ত যাওয়া পর্যন্ত) — তবে ঐ দিনের আসর আদায় না করে থাকলে পড়ে নিতে হবে।',
    ],
  },
  {
    title: 'সাহু সিজদা কখন দিতে হয়',
    items: [
      'নামাজের কোনো ওয়াজিব ভুলে ছুটে গেলে বা দেরি হলে (যেমন প্রথম বৈঠক ভুলে যাওয়া, সূরা ফাতিহা ছুটে যাওয়া) শেষ বৈঠকে সাহু সিজদা দিতে হয়।',
      'নিয়ম: শেষ বৈঠকে আত্তাহিয়্যাতু পড়ে ডান দিকে এক সালাম ফিরিয়ে দুইটি সিজদা করুন, তারপর আবার আত্তাহিয়্যাতু, দরুদ ও দোয়া মাসূরা পড়ে সালাম ফেরান।',
      'ফরজ ভুলে ছুটে গেলে সাহু সিজদায় নামাজ হবে না, আবার পড়তে হবে।',
    ],
  },
];

export default function NamazGuide() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<number | null>(0);
  const bn = (n: number) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);

  return (
    <div className="flex flex-col min-h-full bg-[#f5f5f0] dark:bg-[#0c0c0c] pb-8">
      <div className="bg-emerald-800 dark:bg-emerald-950 pt-12 pb-6 px-4 rounded-b-[40px] shadow-lg flex items-center">
        <button onClick={() => navigate(-1)} className="text-white p-2 bg-white/10 rounded-xl -ml-1">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white ml-3">নামাজ শিক্ষা</h1>
      </div>

      <div className="p-4 space-y-5">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">রাকাত সংখ্যা (হানাফি)</h3>
          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-2 shadow-sm border border-slate-100 dark:border-slate-800">
            {RAKAT.map((r, idx) => {
              const total = r.parts.reduce((s, p) => s + (p[1] as number), 0);
              return (
                <div key={r.name} className={cn('p-3', idx !== RAKAT.length - 1 && 'border-b border-slate-50 dark:border-slate-800')}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{r.name}</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">মোট {bn(total)} রাকাত</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.parts.map((p, i) => (
                      <span key={i} className={cn('text-[11px] px-2 py-1 rounded-lg',
                        String(p[0]).startsWith('ফরজ') ? 'bg-emerald-600 text-white' : String(p[0]).startsWith('বিতর') ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}>
                        {p[0]} {bn(p[1] as number)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {SECTIONS.map((sec, i) => (
          <div key={sec.title} className="bg-white dark:bg-slate-900 rounded-[28px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex justify-between items-center p-5">
              <span className="font-bold text-slate-800 dark:text-slate-100">{sec.title}</span>
              <ChevronDown size={18} className={cn('text-slate-400 transition-transform', open === i && 'rotate-180')} />
            </button>
            {open === i && (
              <ol className="px-5 pb-5 space-y-3">
                {sec.items.map((it, j) => (
                  <li key={j} className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    <span className="shrink-0 w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center">{bn(j + 1)}</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
        <p className="text-[11px] text-center text-slate-400 px-4">বিস্তারিত মাসআলার জন্য একজন নির্ভরযোগ্য আলেমের পরামর্শ নিন।</p>
      </div>
    </div>
  );
}
