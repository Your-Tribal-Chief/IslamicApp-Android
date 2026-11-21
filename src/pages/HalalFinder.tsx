import React from 'react';
import NearbyFinder from '../components/NearbyFinder';
import { findRestaurants, Place } from '../lib/net';

const isHalal = (p: Place) => {
  const t = p.tags || {};
  return (
    (p.name || '').toLowerCase().includes('halal') ||
    (t.cuisine || '').toLowerCase().includes('halal') ||
    ['yes', 'only'].includes((t['diet:halal'] || '').toLowerCase()) ||
    (t.halal || '').toLowerCase() === 'yes'
  );
};

// বাংলাদেশে বেশিরভাগ রেস্টুরেন্টে OSM-এ halal ট্যাগ থাকে না; তাই ট্যাগযুক্তগুলো আগে, তারপর বাকিগুলো দূরত্ব অনুযায়ী
const toRow = (p: Place) => {
  const h = isHalal(p);
  return { badge: h ? '✓ হালাল ট্যাগযুক্ত' : undefined, sortKey: h ? 0 : 1 };
};

export default function HalalFinder() {
  return (
    <NearbyFinder
      title="হালাল রেস্টুরেন্ট"
      subtitle="আপনার ৩ কিমির মধ্যে থাকা রেস্টুরেন্ট"
      listTitle="কাছাকাছি রেস্টুরেন্ট"
      loadingText="কাছের রেস্টুরেন্ট খোঁজা হচ্ছে..."
      emptyText="৩ কিমির মধ্যে ম্যাপে কোনো রেস্টুরেন্ট পাওয়া যায়নি।"
      fallbackName="রেস্টুরেন্ট"
      search={findRestaurants}
      toRow={toRow}
    />
  );
}
