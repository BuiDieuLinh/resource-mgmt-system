import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './src/modules/auth/screens/LoginScreen';
import { TabNavigator } from './src/navigation/TabNavigator';
import { TimesheetScreen } from './src/modules/attendances/screens/TimesheetScreen';
import { EmployeesScreen } from './src/modules/employees/screens/EmployeesScreen';
import { MyReviewsScreen, MyAwardsScreen } from './src/modules/performance';
import { MyProfileScreen } from './src/modules/profile/screens/MyProfileScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

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
          <Stack.Screen name="MyProfile" component={MyProfileScreen} />
          <Stack.Screen name="MyReviews" component={MyReviewsScreen} />
          <Stack.Screen name="MyAwards" component={MyAwardsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
        </QueryClientProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
