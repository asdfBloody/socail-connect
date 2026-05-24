module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-gesture-handler|react-native-reanimated|react-native-worklets|react-native-screens|react-native-safe-area-context|react-native-responsive-dimensions|react-native-image-picker|@react-native-firebase)/)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
