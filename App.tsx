import React, { useEffect, useState } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import auth from '@react-native-firebase/auth';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createStackNavigator();

function App(): React.JSX.Element | null{

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((userObject) => {
      setUser(userObject);
      setLoading(false);
    });
    return unsubscribe; 
  }, []);

  if (loading) return null;
  return (
    <NavigationContainer>
      <Stack.Navigator
       initialRouteName={user ? 'Home':'Login'}>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="SignUp" 
          component={SignUpScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;