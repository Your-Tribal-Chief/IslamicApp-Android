import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourtribalchief.islamicapp',
  appName: 'Islamic App',
  webDir: 'dist',
  android: {
    adjustMarginsForEdgeToEdge: 'force',
  },
  plugins: {
    // সাধারণ fetch WebView দিয়েই যাবে; Groq, OSM, gold-api-র মতো request গুলো src/lib/net.ts থেকে
    // সরাসরি native CapacitorHttp দিয়ে পাঠানো হয় (নিজস্ব User-Agent সহ, CORS ছাড়া)
    CapacitorHttp: { enabled: false },
    SplashScreen: { launchShowDuration: 800, backgroundColor: '#065f46' },
    LocalNotifications: { iconColor: '#065f46' },
  },
};

export default config;
