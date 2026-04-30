// Tông màu chủ đạo: Deep Purple (khớp với web)
export const colors = {
  primary: '#4C3B8F',
  primaryLight: '#6B5BB0',
  primaryDark: '#2E1F6B',
  primarySurface: '#EDE9F8',

  secondary: '#7C3AED',
  accent: '#A78BFA',

  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Backgrounds
  background: '#F8F7FF',
  surface: '#FFFFFF',
  surfaceVariant: '#F3F0FF',
  border: '#E5E7EB',

  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Status
  checkedIn: '#10B981',
  checkedOut: '#6B7280',
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
  absent: '#EF4444',
  onLeave: '#3B82F6',
};

export const gradients = {
  primary: ['#4C3B8F', '#7C3AED'] as const,
  primaryLight: ['#6B5BB0', '#A78BFA'] as const,
  success: ['#059669', '#10B981'] as const,
  warning: ['#D97706', '#F59E0B'] as const,
  error: ['#DC2626', '#EF4444'] as const,
  card: ['#FFFFFF', '#F8F7FF'] as const,
  dark: ['#1F2937', '#374151'] as const,
};
