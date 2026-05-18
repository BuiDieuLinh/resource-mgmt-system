import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';

import { HomeScreen } from '../modules/home/screens/HomeScreen';
import { LeaveRequestsScreen } from '../modules/leave-requests/screens/LeaveRequestsScreen';
import { ProfileScreen } from '../modules/profile/screens/ProfileScreen';
import { CheckInScreen } from '../modules/attendances/screens/CheckInScreen';

const Tab = createBottomTabNavigator();

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({ name, focused, label }) => (
  <View style={styles.tabItem}>
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Ionicons
        name={focused ? name : (`${name}-outline` as any)}
        size={20}
        color={focused ? colors.primary : colors.gray400}
      />
    </View>
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name="home" focused={focused} label="Home" />
          ),
        }}
      />
      <Tab.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name="finger-print" focused={focused} label="Check-In" />
          ),
        }}
      />
      <Tab.Screen
        name="Leave"
        component={LeaveRequestsScreen}
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name="calendar" focused={focused} label="Leave" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name="person" focused={focused} label="Profile" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 85 : 65,
    backgroundColor: colors.white,
    borderTopWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    ...shadow.md,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  iconWrapper: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  iconWrapperActive: {
    backgroundColor: colors.primarySurface,
  },
  tabLabel: {
    fontSize: 9,
    color: colors.gray400,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkInTab: {
    alignItems: 'center',
    marginTop: -20,
  },
  checkInIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  checkInIconActive: {
    backgroundColor: colors.primaryDark,
  },
});
