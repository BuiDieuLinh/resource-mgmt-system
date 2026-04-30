import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/api';
import { useAuth } from '../../../hooks';
import { Card, Badge } from '../../../components';
import { colors, gradients, spacing, radius, shadow } from '../../../theme';

interface AttendanceRecord {
  id?: string;
  check_in_time?: string;
  check_out_time?: string;
  status?: string;
  late?: number;
  work_minutes?: number;
}

const formatTime = (iso?: string | null): string => {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

const formatMinutes = (mins?: number): string => {
  if (!mins || mins === 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const CheckInScreen: React.FC = () => {
  const { user } = useAuth();
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isCheckedIn = !!record?.check_in_time;
  const isCheckedOut = !!record?.check_out_time;

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayRecord = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await apiClient.get('/attendances/my', {
        params: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
      });
      const records = res.data?.data?.records ?? [];
      const todayRecord = records.find((r: any) => r.work_date?.startsWith(today));
      setRecord(todayRecord ?? null);
    } catch (err) {
      console.error('Fetch attendance error:', err);
    }
  }, []);

  useEffect(() => {
    fetchTodayRecord();
  }, [fetchTodayRecord]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTodayRecord();
    setRefreshing(false);
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await apiClient.post('/attendances/check-in');
      await fetchTodayRecord();
      Alert.alert(
        '✅ Checked In!',
        `Welcome! You checked in at ${formatTime(new Date().toISOString())}`,
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    Alert.alert('Check Out', 'Are you sure you want to check out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Check Out',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await apiClient.post('/attendances/check-out');
            await fetchTodayRecord();
            Alert.alert('👋 Checked Out!', 'Have a great rest of your day!');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to check out');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const timeStr = currentTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  const dateStr = currentTime.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const getStatusBadge = () => {
    if (isCheckedOut) return <Badge label="Completed" variant="success" />;
    if (isCheckedIn) return <Badge label="Working" variant="info" />;
    return <Badge label="Not checked in" variant="default" />;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <LinearGradient
          colors={gradients.primary}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.greeting}>
            Good{' '}
            {currentTime.getHours() < 12
              ? 'morning'
              : currentTime.getHours() < 18
                ? 'afternoon'
                : 'evening'}
            , {user?.email?.split('@')[0] ?? 'there'} 👋
          </Text>
          <Text style={styles.clock}>{timeStr}</Text>
          <Text style={styles.date}>{dateStr}</Text>
          <View style={styles.statusRow}>{getStatusBadge()}</View>
        </LinearGradient>

        {/* Main check-in button */}
        <View style={styles.buttonSection}>
          {!isCheckedOut && (
            <TouchableOpacity
              onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
              disabled={loading}
              activeOpacity={0.9}
              style={styles.mainButtonWrapper}
            >
              <LinearGradient
                colors={isCheckedIn ? [colors.error, '#FF6B6B'] : gradients.primary}
                style={styles.mainButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name={isCheckedIn ? 'log-out-outline' : 'finger-print'}
                  size={52}
                  color={colors.white}
                />
                <Text style={styles.mainButtonText}>
                  {loading ? 'Processing...' : isCheckedIn ? 'Check Out' : 'Check In'}
                </Text>
                <Text style={styles.mainButtonSub}>
                  {isCheckedIn ? 'Tap to end your shift' : 'Tap to start your shift'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {isCheckedOut && (
            <View style={styles.completedSection}>
              <Ionicons name="checkmark-circle" size={80} color={colors.success} />
              <Text style={styles.completedText}>Shift Complete!</Text>
              <Text style={styles.completedSub}>Great work today 🎉</Text>
            </View>
          )}
        </View>

        {/* Today's stats */}
        {record && (
          <Card style={styles.statsCard}>
            <Text style={styles.statsTitle}>Today's Summary</Text>
            <View style={styles.statsGrid}>
              <StatItem
                icon="log-in-outline"
                label="Check In"
                value={formatTime(record.check_in_time)}
                color={colors.success}
              />
              <StatItem
                icon="log-out-outline"
                label="Check Out"
                value={formatTime(record.check_out_time)}
                color={colors.error}
              />
              <StatItem
                icon="time-outline"
                label="Work Time"
                value={formatMinutes(record.work_minutes)}
                color={colors.info}
              />
              <StatItem
                icon="alert-circle-outline"
                label="Late"
                value={record.late && record.late > 0 ? formatMinutes(record.late) : 'On time'}
                color={record.late && record.late > 0 ? colors.warning : colors.success}
              />
            </View>
          </Card>
        )}

        {/* Tips */}
        {!isCheckedIn && (
          <Card variant="flat" style={styles.tipCard}>
            <View style={styles.tipRow}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.tipText}>
                Work hours: 08:00 – 17:00. Please check in before 08:15 to avoid being marked late.
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const StatItem = ({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) => (
  <View style={statStyles.item}>
    <View style={[statStyles.iconBg, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={statStyles.label}>{label}</Text>
    <Text style={[statStyles.value, { color }]}>{value}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  item: { alignItems: 'center', flex: 1 },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  value: { fontSize: 14, fontWeight: '700' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 32 },
  header: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  clock: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  date: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  statusRow: { marginTop: spacing.md },
  buttonSection: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  mainButtonWrapper: {
    ...shadow.lg,
    borderRadius: 80,
  },
  mainButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mainButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  mainButtonSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
  },
  completedSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: 8,
  },
  completedText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
  },
  completedSub: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  statsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipCard: {
    marginHorizontal: spacing.lg,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
