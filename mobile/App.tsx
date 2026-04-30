import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from './src/hooks/useAuth';
import { LoginScreen } from './src/modules/auth/screens/LoginScreen';
import { TabNavigator } from './src/navigation/TabNavigator-simple';
import { TimesheetScreen } from './src/modules/attendances/screens/TimesheetScreen';
import { EmployeesScreen } from './src/modules/employees/screens/EmployeesScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isLoading, isLoggedIn } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8F7FF',
        }}
      >
        <ActivityIndicator size="large" color="#4C3B8F" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Timesheet" component={TimesheetScreen} />
          <Stack.Screen name="Employees" component={EmployeesScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
