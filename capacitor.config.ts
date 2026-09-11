import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jaknooma.app',
  appName: 'Jaknooma',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
