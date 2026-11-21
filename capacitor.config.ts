import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourtribalchief.islamicapp',
  appName: 'Islamic App',
  webDir: 'dist',
  android: {
    adjustMarginsForEdgeToEdge: 'force',
  },
  plugins: {
    // fetch() native layer দিয়ে যাবে, ফলে CORS সমস্যা হবে না (Overpass, Groq, gold-api ইত্যাদি)
    CapacitorHttp: { enabled: true },
    SplashScreen: { launchShowDuration: 800, backgroundColor: '#065f46' },
    LocalNotifications: { iconColor: '#065f46' },
  },
};

export default config;
