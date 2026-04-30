import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { View } from 'react-native';

// Import theme
import { theme } from './src/theme';

// Import components
import { Loading } from './src/components';

// Import screens from modules
import { LoginScreen } from './src/modules/auth';
import { HomeScreen } from './src/modules/home';
import { EmployeesScreen } from './src/modules/employees';
import { AttendancesScreen } from './src/modules/attendances';
import { LeaveRequestsScreen } from './src/modules/leave-requests';

// Import hooks
import { useAuth } from './src/hooks';

const Stack = createNativeStackNavigator();

export default function App() {
  const { isLoading, isLoggedIn } = useAuth();
  console.log('isLoggedIn:', isLoggedIn, typeof isLoggedIn);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Loading message="Initializing app..." />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={isLoggedIn ? 'Home' : 'Login'}>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
          <Stack.Screen
            name="Employees"
            component={EmployeesScreen}
            options={{ title: 'Employees' }}
          />
          <Stack.Screen
            name="Attendances"
            component={AttendancesScreen}
            options={{ title: 'Attendances' }}
          />
          <Stack.Screen
            name="LeaveRequests"
            component={LeaveRequestsScreen}
            options={{ title: 'Leave Requests' }}
          />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </PaperProvider>
  );
}
