// Expo app configuration. Firebase web config keys are safe to ship in the
// client bundle (they are public identifiers, not secrets). Data is protected
// by Firestore Security Rules, not by hiding these values.
module.exports = {
  expo: {
    name: 'Tiffin Manager',
    slug: 'tiffin-manager',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'tiffin',
    userInterfaceStyle: 'light',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FF5A3C',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.tiffin.manager',
    },
    android: {
      package: 'com.tiffin.manager',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FF5A3C',
      },
      permissions: ['POST_NOTIFICATIONS', 'SCHEDULE_EXACT_ALARM'],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-notifications',
        {
          color: '#FF7043',
        },
      ],
    ],
    extra: {
      // GitHub repo ("owner/name") for in-app update checks via Releases.
      githubRepo: process.env.EXPO_PUBLIC_GITHUB_REPO || 'PushkarPisolkar04/meal-distributor',
      // Firebase Web config. These are public client identifiers (safe to ship
      // in the app / repo); data is protected by Firestore Security Rules. Env
      // vars override these for local dev.
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyADddScer_YO0JmOcKAT0hdN_GpnOb0-ME',
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'tiffin-manager-52c24.firebaseapp.com',
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'tiffin-manager-52c24',
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'tiffin-manager-52c24.firebasestorage.app',
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '426672193870',
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:426672193870:web:20c4ac711aad39696c5e1f',
      },
    },
  },
};
