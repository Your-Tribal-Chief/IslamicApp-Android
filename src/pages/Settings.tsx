import React, { useState } from 'react';
import { ChevronLeft, Bell, Globe, Moon, Shield, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { requestNotifyPermission, cancelPrayerNotifications } from '../lib/native';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotificationsState] = useState(() => localStorage.getItem('notifications') === 'true');
  const setNotifications = async () => {
    if (!notifications) {
      if (await requestNotifyPermission()) {
        localStorage.setItem('notifications', 'true');
        setNotificationsState(true);
      }
    } else {
      localStorage.setItem('notifications', 'false');
      cancelPrayerNotifications();
      setNotificationsState(false);
    }
  };

  const [asrSchool, setAsrSchool] = useState(() => localStorage.getItem('asrSchool') ?? '1');
  const [hijriAdj, setHijriAdj] = useState(() => Number(localStorage.getItem('hijriAdjust') ?? '-1'));

  const settingsGroups: any[] = [
    {
      title: 'সাধারণ',
      items: [
        { id: 'notifications', icon: <Bell size={20} className="text-emerald-600" />, label: 'প্রার্থনার সময় নোটিফিকেশন', type: 'toggle', value: notifications, onChange: setNotifications },
        { id: 'language', icon: <Globe size={20} className="text-blue-600" />, label: 'ভাষা (Language)', type: 'select', value: 'বাংলা' },
        { id: 'theme', icon: <Moon size={20} className="text-indigo-600" />, label: 'ডার্ক মোড', type: 'toggle', value: theme === 'dark', onChange: toggleTheme },
      ]
    },
    {
      title: 'হিসাব পদ্ধতি',
      items: [
        { id: 'calculation', label: 'নামাজের সময় হিসাব পদ্ধতি', type: 'select', value: 'Karachi (বাংলাদেশ)' },
        { id: 'asr', label: 'আসর নামাজের পদ্ধতি', type: 'select', value: asrSchool === '1' ? 'হানাফি' : 'শাফেয়ী', onClick: () => { const v = asrSchool === '1' ? '0' : '1'; localStorage.setItem('asrSchool', v); setAsrSchool(v); } },
        { id: 'hijri', label: 'হিজরি তারিখ সমন্বয়', type: 'select', value: `${hijriAdj > 0 ? '+' : ''}${hijriAdj} দিন`.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]), onClick: () => { const opts = [-2, -1, 0, 1]; const v = opts[(opts.indexOf(hijriAdj) + 1) % opts.length]; localStorage.setItem('hijriAdjust', String(v)); setHijriAdj(v); } },
      ]
    },
    {
      title: 'অন্যান্য',
      items: [
        { id: 'privacy', icon: <Shield size={20} className="text-slate-600" />, label: 'প্রাইভেসি পলিসি', type: 'link', onClick: () => alert('আপনার সব আমল, কাযা হিসাব ও সেটিংস শুধু আপনার ফোনেই সংরক্ষিত থাকে। লোকেশন শুধু নামাজের সময়, কিবলা ও কাছের মসজিদ খুঁজতে ব্যবহার হয়। "হুজুরকে জিজ্ঞাসা" ফিচারে আপনার প্রশ্ন উত্তর তৈরির জন্য Groq AI সার্ভারে পাঠানো হয়।') },
        { id: 'help', icon: <HelpCircle size={20} className="text-slate-600" />, label: 'সাহায্য ও সাপোর্ট', type: 'link', onClick: () => alert('যেকোনো সমস্যা বা পরামর্শের জন্য GitHub-এ যোগাযোগ করুন: github.com/Your-Tribal-Chief') },
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#f5f5f0] dark:bg-[#0c0c0c] pb-8 transition-colors duration-300">
      <div className="bg-emerald-800 dark:bg-emerald-950 pt-12 pb-6 px-4 rounded-b-[40px] shadow-lg sticky top-0 z-20">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate(-1)} className="text-white p-2 bg-white/10 rounded-xl backdrop-blur-sm -ml-1">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white ml-3">সেটিংস</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 mt-2">
        {settingsGroups.map((group, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">{group.title}</h3>
            <div className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
              {group.items.map((item, itemIdx) => (
                <div key={item.id} onClick={() => item.onClick?.()} className={`flex items-center justify-between p-5 ${item.onClick ? 'cursor-pointer active:bg-slate-50 dark:active:bg-slate-800' : ''} ${itemIdx !== group.items.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}>
                  <div className="flex items-center space-x-4">
                    {item.icon && <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">{item.icon}</div>}
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{item.label}</span>
                  </div>
                  
                  {item.type === 'toggle' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); item.onChange && item.onChange(!item.value); }}
                      className={`w-12 h-6 rounded-full transition-colors relative ${item.value ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${item.value ? 'left-7' : 'left-1'}`} />
                    </button>
                  )}
                  
                  {item.type === 'select' && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-lg max-w-[120px] truncate">
                      {item.value}
                    </span>
                  )}
                  
                  {item.type === 'link' && (
                    <ChevronLeft size={16} className="text-slate-300 dark:text-slate-600 rotate-180" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-[11px] text-slate-400 text-center px-6">আসর পদ্ধতি পরিবর্তনের পর হোম স্ক্রিন আবার খুললে নতুন সময় দেখাবে।</p>
      </div>
    </div>
  );
}
