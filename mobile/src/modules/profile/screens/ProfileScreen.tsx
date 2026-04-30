import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks';
import { Card } from '../../../components';
import { colors, gradients, spacing, radius } from '../../../theme';

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
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={gradients.primary}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Profile</Text>
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
        </LinearGradient>

        <View style={styles.content}>
          {/* Account section */}
          <View>
            <Text style={styles.sectionLabel}>Account</Text>
            <Card style={styles.menuCard}>
              <MenuRow icon="person-outline" label="Edit Profile" onPress={() => {}} />
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
  content: { padding: spacing.lg, gap: spacing.sm },
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
