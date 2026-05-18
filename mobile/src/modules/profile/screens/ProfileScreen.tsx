import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks';
import { Card, GradientHeader } from '@/components';
import { colors, spacing, radius } from '@/theme';

interface MenuRow {
  icon: any;
  label: string;
  onPress: () => void;
  color?: string;
  showArrow?: boolean;
}

const MenuRow: React.FC<MenuRow> = ({
  icon,
  label,
  onPress,
  color = colors.primary,
  showArrow = true,
}) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuRowIcon, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.menuRowLabel}>{label}</Text>
    {showArrow && <Ionicons name="chevron-forward" size={16} color={colors.gray400} />}
  </TouchableOpacity>
);

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const displayName = user?.email?.split('@')[0] ?? 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <View style={styles.container}>
      <GradientHeader style={styles.header}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.rolesRow}>
            {(user?.roles ?? []).map((role) => (
              <View key={role} style={styles.roleChip}>
                <Text style={styles.roleText}>{role}</Text>
              </View>
            ))}
          </View>
        </View>
      </GradientHeader>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Account section */}
        <View>
          <Text style={styles.sectionLabel}>Account</Text>
          <Card style={styles.menuCard}>
            <MenuRow
              icon="person-outline"
              label="My Profile"
              onPress={() => navigation.getParent()?.navigate('MyProfile')}
            />
            <View style={styles.divider} />
            <MenuRow icon="lock-closed-outline" label="Change Password" onPress={() => {}} />
            <View style={styles.divider} />
            <MenuRow icon="notifications-outline" label="Notifications" onPress={() => {}} />
          </Card>
        </View>

        {/* Work section */}
        <View>
          <Text style={styles.sectionLabel}>Work</Text>
          <Card style={styles.menuCard}>
            <MenuRow
              icon="calendar-outline"
              label="My Timesheet"
              onPress={() => navigation.getParent()?.navigate('Timesheet')}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="calendar-clear-outline"
              label="Leave Requests"
              onPress={() => navigation.navigate('Leave')}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="star-outline"
              label="My Reviews"
              onPress={() => navigation.getParent()?.navigate('MyReviews')}
              color="#9333EA"
            />
            <View style={styles.divider} />
            <MenuRow
              icon="trophy-outline"
              label="My Awards"
              onPress={() => navigation.getParent()?.navigate('MyAwards')}
              color="#F59E0B"
            />
          </Card>
        </View>

        {/* App section */}
        <View>
          <Text style={styles.sectionLabel}>App</Text>
          <Card style={styles.menuCard}>
            <MenuRow icon="information-circle-outline" label="About" onPress={() => {}} />
            <View style={styles.divider} />
            <MenuRow
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleLogout}
              color={colors.error}
              showArrow={false}
            />
          </Card>
        </View>

        <Text style={styles.version}>RMS Core v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.white, marginBottom: spacing.lg },
  avatarSection: { alignItems: 'center', gap: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: colors.white },
  userName: { fontSize: 20, fontWeight: '700', color: colors.white, textTransform: 'capitalize' },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  rolesRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  roleChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  roleText: { fontSize: 11, color: colors.white, fontWeight: '600', textTransform: 'capitalize' },
  content: { padding: spacing.lg, gap: spacing.sm, flex: 1 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: spacing.sm,
  },
  menuCard: { padding: 0, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowLabel: { flex: 1, fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg + 36 + spacing.md },
  version: { textAlign: 'center', fontSize: 12, color: colors.gray400, marginTop: spacing.lg },
});
