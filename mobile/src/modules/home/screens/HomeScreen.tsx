import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks';
import { apiClient } from '../../../lib/api';
import { Card, Badge } from '../../../components';
import { colors, gradients, spacing, radius, shadow } from '../../../theme';

interface MenuItem {
  label: string;
  icon: any;
  screen: string;
  color: string;
  bg: string;
  badge?: string;
}

const formatTime = (iso?: string | null) => {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState(0);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [attRes, leaveRes] = await Promise.allSettled([
        apiClient.get('/attendances/my', {
          params: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
        }),
        apiClient.get('/leave-requests/my', { params: { status: 'pending' } }),
      ]);

      if (attRes.status === 'fulfilled') {
        const records = attRes.value.data?.data?.records ?? [];
        const rec = records.find((r: any) => r.work_date?.startsWith(today));
        setTodayRecord(rec ?? null);
      }
      if (leaveRes.status === 'fulfilled') {
        const leaves = leaveRes.value.data?.data ?? [];
        setPendingLeaves(Array.isArray(leaves) ? leaves.length : 0);
      }
    } catch (err) {
      console.error('Fetch home data error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const isCheckedIn = !!todayRecord?.check_in_time;
  const isCheckedOut = !!todayRecord?.check_out_time;

  const handleNavigate = (screen: string) => {
    // Navigate to tab screens directly, use parent for stack screens
    if (screen === 'Timesheet' || screen === 'Employees') {
      navigation.getParent()?.navigate(screen);
    } else {
      navigation.navigate(screen);
    }
  };

  const menuItems: MenuItem[] = [
    {
      label: 'Check In/Out',
      icon: 'finger-print',
      screen: 'CheckIn',
      color: colors.primary,
      bg: colors.primarySurface,
    },
    {
      label: 'My Timesheet',
      icon: 'calendar-outline',
      screen: 'Timesheet',
      color: colors.info,
      bg: colors.infoLight,
    },
    {
      label: 'Leave Requests',
      icon: 'calendar-clear-outline',
      screen: 'Leave',
      color: colors.warning,
      bg: colors.warningLight,
      badge: pendingLeaves > 0 ? String(pendingLeaves) : undefined,
    },
    {
      label: 'My Profile',
      icon: 'person-outline',
      screen: 'Profile',
      color: colors.secondary,
      bg: '#F3E8FF',
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.email?.split('@')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={gradients.primary}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.userName}>{displayName}</Text>
            </View>
          </View>

          {/* Today status card */}
          <View style={styles.todayCard}>
            <View style={styles.todayLeft}>
              <Text style={styles.todayLabel}>Today's Status</Text>
              <View style={styles.todayStatus}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isCheckedOut
                        ? colors.gray400
                        : isCheckedIn
                          ? colors.success
                          : colors.warning,
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {isCheckedOut ? 'Shift ended' : isCheckedIn ? 'Working' : 'Not checked in'}
                </Text>
              </View>
            </View>
            <View style={styles.todayTimes}>
              <View style={styles.timeItem}>
                <Ionicons name="log-in-outline" size={14} color={colors.success} />
                <Text style={styles.timeValue}>{formatTime(todayRecord?.check_in_time)}</Text>
              </View>
              <View style={styles.timeItem}>
                <Ionicons name="log-out-outline" size={14} color={colors.error} />
                <Text style={styles.timeValue}>{formatTime(todayRecord?.check_out_time)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Quick check-in CTA */}
        {!isCheckedIn && (
          <View style={styles.ctaWrapper}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('CheckIn')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={gradients.success}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="finger-print" size={24} color={colors.white} />
                <View>
                  <Text style={styles.ctaTitle}>Ready to start?</Text>
                  <Text style={styles.ctaSub}>Tap to check in now</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <View key={item.label} style={styles.menuItemWrapper}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigate(item.screen)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={24} color={item.color} />
                    {item.badge && (
                      <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Date info */}
        <Card variant="flat" style={styles.dateCard}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 8,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  userName: { fontSize: 22, fontWeight: '700', color: colors.white, textTransform: 'capitalize' },
  todayCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  todayLeft: { gap: 4 },
  todayLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  todayStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: '600', color: colors.white },
  todayTimes: { gap: 6 },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeValue: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  ctaWrapper: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  ctaButton: { borderRadius: radius.lg, overflow: 'hidden', ...shadow.md },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  ctaTitle: { fontSize: 15, fontWeight: '700', color: colors.white },
  ctaSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  section: { padding: spacing.lg },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuItemWrapper: { width: '47%' },
  menuItem: { alignItems: 'center', gap: 8 },
  menuIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  menuBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  menuBadgeText: { fontSize: 10, color: colors.white, fontWeight: '700' },
  menuLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', fontWeight: '500' },
  dateCard: { marginHorizontal: spacing.lg, marginBottom: spacing.xl },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 13, color: colors.textSecondary },
});
