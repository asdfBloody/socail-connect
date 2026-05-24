import React, {useEffect} from 'react';
import {Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import {AuthProvider, useAuth} from './src/context/AuthContext';
import {PostProvider} from './src/context/PostContext';
import {FollowProvider} from './src/context/FollowContext';
import {
  requestNotificationPermission,
  saveFCMToken,
  setupForegroundNotifications,
  setupBackgroundNotificationHandler,
} from './src/services/NotificationService';

import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CommentsScreen from './src/screens/CommentsScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ChatScreen from './src/screens/ChatScreen';
import SearchScreen from './src/screens/SearchScreen';

// Register background handler at module level (required by FCM)
setupBackgroundNotificationHandler();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
          height: 60,
          paddingBottom: 8,
        },
        tabBarIcon: ({focused}) => {
          let icon = '';
          if (route.name === 'Home') icon = focused ? '🏠' : '🏡';
          else if (route.name === 'Search') icon = '🔍';
          else if (route.name === 'Messages') icon = focused ? '💬' : '💭';
          else if (route.name === 'Profile') icon = focused ? '👤' : '👥';
          else if (route.name === 'Settings') icon = '⚙️';
          return <Text style={{fontSize: 20}}>{icon}</Text>;
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const {user, loading} = useAuth();

  useEffect(() => {
    if (!user) return;

    let unsubForeground: (() => void) | undefined;

    const initNotifications = async () => {
      const granted = await requestNotificationPermission();
      if (granted) {
        await saveFCMToken();
        unsubForeground = setupForegroundNotifications();
      }
    };

    initNotifications();

    return () => {
      unsubForeground?.();
    };
  }, [user]);

  if (loading) return null;

  return (
    <Stack.Navigator
      initialRouteName={user ? 'MainTabs' : 'Login'}
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Comments"
        component={CommentsScreen}
        options={{
          headerShown: true,
          title: 'Comments',
          headerTintColor: '#6C63FF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          headerShown: true,
          title: 'Profile',
          headerTintColor: '#6C63FF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
          title: 'Chat',
          headerTintColor: '#6C63FF',
          headerTitleStyle: {fontWeight: 'bold'},
        }}
      />
    </Stack.Navigator>
  );
}

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <FollowProvider>
        <PostProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </PostProvider>
      </FollowProvider>
    </AuthProvider>
  );
}

export default App;
