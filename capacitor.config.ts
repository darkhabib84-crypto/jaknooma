import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jaknooma.app',
  appName: 'Jaknooma',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '215148796185-e5gae926ms56t6vtgmt0hdlah12s8s6i.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
