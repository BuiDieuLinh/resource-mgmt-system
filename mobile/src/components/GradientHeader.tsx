import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gradients } from '../theme';

interface GradientHeaderProps {
  children: ReactNode;
  style?: ViewStyle;
  colors?: readonly [string, string, ...string[]];
}

export const GradientHeader: React.FC<GradientHeaderProps> = ({
  children,
  style,
  colors: customColors,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={customColors || gradients.primary}
      style={[styles.gradient, { paddingTop: insets.top }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={[styles.content, style]}>{children}</View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  content: {
    // Content padding will be added by parent
  },
});
