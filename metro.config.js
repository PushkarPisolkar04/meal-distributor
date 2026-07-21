// Metro config tuned for the Firebase JS SDK.
//
// Expo SDK 54 enables Metro's "package exports" resolution by default, which
// makes firebase/* resolve to its web/ESM build under React Native. That breaks
// Firebase Auth ("Component auth has not been registered yet") and React Native
// persistence. Disabling package exports and adding the .cjs extension makes
// firebase resolve to its React Native CommonJS build correctly.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
