import React from 'react';
import NearbyFinder from '../components/NearbyFinder';
import { findMosques } from '../lib/net';

export default function MosqueFinder() {
  return (
    <NearbyFinder
      title="মসজিদ খুঁজুন"
      subtitle="আপনার ৩ কিমির মধ্যে থাকা মসজিদসমূহ"
      listTitle="কাছাকাছি মসজিদসমূহ"
      loadingText="কাছের মসজিদ খোঁজা হচ্ছে..."
      emptyText="৩ কিমির মধ্যে ম্যাপে কোনো মসজিদ পাওয়া যায়নি।"
      fallbackName="মসজিদ"
      search={findMosques}
    />
  );
}
