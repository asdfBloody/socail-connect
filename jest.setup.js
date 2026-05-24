/* eslint-disable no-undef */
jest.mock('@react-native-firebase/app', () => ({}));

jest.mock('@react-native-firebase/auth', () => {
  const auth = () => ({
    currentUser: null,
    onAuthStateChanged: cb => {
      cb(null);
      return () => {};
    },
    signOut: jest.fn(),
  });
  return {__esModule: true, default: auth};
});

jest.mock('@react-native-firebase/firestore', () => {
  const fakeDoc = () => ({
    get: jest.fn(() => Promise.resolve({data: () => ({})})),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
    onSnapshot: cb => {
      cb({data: () => ({}), docs: []});
      return () => {};
    },
    collection: () => fakeCollection(),
  });
  const fakeCollection = () => ({
    doc: () => fakeDoc(),
    add: jest.fn(() => Promise.resolve()),
    where: () => fakeCollection(),
    orderBy: () => fakeCollection(),
    limit: () => fakeCollection(),
    get: jest.fn(() => Promise.resolve({docs: []})),
    onSnapshot: cb => {
      cb({docs: []});
      return () => {};
    },
  });
  const firestore = () => ({
    collection: () => fakeCollection(),
    batch: () => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(() => Promise.resolve()),
    }),
  });
  firestore.FieldValue = {
    arrayUnion: jest.fn(),
    arrayRemove: jest.fn(),
    serverTimestamp: jest.fn(),
  };
  return {__esModule: true, default: firestore};
});

jest.mock('@react-native-firebase/messaging', () => {
  const messaging = () => ({
    requestPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve('test-token')),
    onTokenRefresh: jest.fn(() => () => {}),
    onMessage: jest.fn(() => () => {}),
    setBackgroundMessageHandler: jest.fn(),
  });
  messaging.AuthorizationStatus = {AUTHORIZED: 1, PROVISIONAL: 2};
  return {__esModule: true, default: messaging};
});

jest.mock('@react-native-firebase/storage', () => ({}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(() => Promise.resolve({assets: []})),
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const {View, Text} = require('react-native');
  return {
    __esModule: true,
    default: {View, Text, createAnimatedComponent: c => c},
    View,
    Text,
    useSharedValue: v => ({value: v}),
    useAnimatedStyle: () => ({}),
    withSpring: v => v,
    withSequence: (...args) => args[args.length - 1],
    withTiming: v => v,
    createAnimatedComponent: c => c,
    Easing: {linear: () => 0, ease: () => 0},
  };
});

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const {View} = require('react-native');
  const passthrough = ({children}) => React.createElement(View, null, children);
  return new Proxy(
    {
      State: {},
      Directions: {},
      gestureHandlerRootHOC: c => c,
      GestureHandlerRootView: passthrough,
    },
    {
      get(target, prop) {
        if (prop in target) return target[prop];
        return passthrough;
      },
    },
  );
});

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  ScreenContainer: ({children}) => children,
  Screen: ({children}) => children,
}));
