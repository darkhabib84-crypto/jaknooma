import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jaknooma.app',
  appName: 'Jaknooma',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

default config;
