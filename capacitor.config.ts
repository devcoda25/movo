import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.movo.escortapp',
  appName: 'Movo',
  webDir: '.next',
  server: {
    // For development, use local server
    // Change this to your computer's local IP address
    url: 'http://192.168.1.100:3000',
    // For Android
    androidScheme: 'http'
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
