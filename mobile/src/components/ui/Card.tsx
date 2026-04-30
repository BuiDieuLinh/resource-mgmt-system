import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  padding = spacing.md,
}) => {
  const variantStyles: Record<string, ViewStyle> = {
    default: { backgroundColor: colors.surface, ...shadow.sm },
    elevated: { backgroundColor: colors.surface, ...shadow.md },
    outlined: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    flat: { backgroundColor: colors.surfaceVariant },
  };

  return <View style={[styles.card, variantStyles[variant], { padding }, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
