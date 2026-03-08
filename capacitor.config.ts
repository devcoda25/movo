import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.movo.escortapp',
  appName: 'Movo',
  webDir: '.next',
  server: {
    // Production URL - app will load from Netlify
    url: 'https://movoapp.netlify.app',
    // For Android
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#7C3AED'
    }
  },
  ios: {
    contentInset: 'always'
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;
