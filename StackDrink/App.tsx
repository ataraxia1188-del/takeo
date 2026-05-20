import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import MainScreen from './src/screens/MainScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import {
  setupNotificationCategory,
  requestNotificationPermissions,
  handleAddMugAction,
  ACTION_ADD_MUG,
} from './src/utils/notifications';

export type RootStackParamList = {
  Main: undefined;
  Calendar: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    (async () => {
      await setupNotificationCategory();
      await requestNotificationPermissions();
    })();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.actionIdentifier === ACTION_ADD_MUG) {
        handleAddMugAction();
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{ title: '今日の記録' }}
        />
        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ title: 'カレンダー' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
