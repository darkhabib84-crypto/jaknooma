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
      serverClientId: 'PUT_YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
