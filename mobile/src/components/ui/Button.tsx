import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing } from '../../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  fullWidth = false,
}) => {
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.sm },
    md: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: radius.md },
    lg: { paddingVertical: 18, paddingHorizontal: 32, borderRadius: radius.lg },
  };

  const textSizes = { sm: 13, md: 15, lg: 17 };

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[fullWidth && { width: '100%' }]}
      >
        <LinearGradient
          colors={isDisabled ? [colors.gray300, colors.gray400] : gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, sizeStyles[size], style]}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.textPrimary, { fontSize: textSizes[size] }, textStyle]}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<string, ViewStyle> = {
    secondary: { backgroundColor: colors.primarySurface },
    outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.error },
  };

  const variantTextColors: Record<string, string> = {
    secondary: colors.primary,
    outline: colors.primary,
    ghost: colors.primary,
    danger: colors.white,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        isDisabled && styles.disabled,
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantTextColors[variant]} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { fontSize: textSizes[size], color: variantTextColors[variant] },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  textPrimary: {
    color: colors.white,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});
