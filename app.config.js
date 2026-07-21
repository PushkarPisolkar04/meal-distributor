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
      // GitHub repo ("owner/name") used for in-app update checks via GitHub
      // Releases. Leave empty to fall back to a Firestore version doc.
      githubRepo: process.env.EXPO_PUBLIC_GITHUB_REPO || '',
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
      },
    },
  },
};
