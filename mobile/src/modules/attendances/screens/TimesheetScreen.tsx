import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/api';
import { useAuth } from '../../../hooks';
import { Card, Badge } from '../../../components';
import { colors, gradients, spacing, radius } from '../../../theme';

interface AttendanceRecord {
  id: string;
  work_date: string;
  check_in_time?: string;
  check_out_time?: string;
  late?: number;
  overtime?: number;
  work_minutes?: number;
  status: string;
}

const fmtTime = (iso?: string | null) => {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

const fmtMins = (m?: number) => {
  if (!m || m === 0) return null;
  const h = Math.floor(m / 60),
    min = m % 60;
  return h > 0 ? `${h}h${min > 0 ? ` ${min}m` : ''}` : `${min}m`;
};

const statusConfig: Record<string, { label: string; variant: any }> = {
  approved: { label: 'Approved', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'error' },
};

export const TimesheetScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const month = selectedMonth.getMonth() + 1;
  const year = selectedMonth.getFullYear();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/attendances/my', { params: { month, year } });
      const data = res.data?.data ?? {};
      setRecords(data.records ?? []);
      setSummary(data.summary ?? null);
    } catch (err) {
      console.error('Fetch timesheet error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const prevMonth = () => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(d);
  };

  const nextMonth = () => {
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() + 1);
    if (d <= new Date()) setSelectedMonth(d);
  };

  const monthLabel = selectedMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  const renderRecord = ({ item, index }: { item: AttendanceRecord; index: number }) => {
    const cfg = statusConfig[item.status] ?? statusConfig.pending;
    const dayLabel = new Date(item.work_date).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
    return (
      <View>
        <Card style={styles.recordCard} variant="outlined">
          <View style={styles.recordHeader}>
            <Text style={styles.recordDate}>{dayLabel}</Text>
            <Badge label={cfg.label} variant={cfg.variant} size="sm" />
          </View>
          <View style={styles.recordTimes}>
            <View style={styles.timeItem}>
              <Ionicons name="log-in-outline" size={14} color={colors.success} />
              <Text style={styles.timeText}>{fmtTime(item.check_in_time)}</Text>
            </View>
            <Ionicons name="arrow-forward" size={12} color={colors.gray400} />
            <View style={styles.timeItem}>
              <Ionicons name="log-out-outline" size={14} color={colors.error} />
              <Text style={styles.timeText}>{fmtTime(item.check_out_time)}</Text>
            </View>
            {item.work_minutes ? (
              <View style={styles.workTime}>
                <Ionicons name="time-outline" size={12} color={colors.info} />
                <Text style={styles.workTimeText}>{fmtMins(item.work_minutes)}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.recordTags}>
            {item.late && item.late > 0 ? (
              <View style={styles.tag}>
                <Text style={[styles.tagText, { color: colors.warning }]}>
                  Late {fmtMins(item.late)}
                </Text>
              </View>
            ) : null}
            {item.overtime && item.overtime > 0 ? (
              <View style={styles.tag}>
                <Text style={[styles.tagText, { color: colors.info }]}>
                  OT +{fmtMins(item.overtime)}
                </Text>
              </View>
            ) : null}
          </View>
        </Card>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={gradients.primary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Timesheet</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Month navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Summary */}
        {summary && (
          <View style={styles.summaryRow}>
            {[
              { label: 'Planned', value: `${summary.plan_day}d` },
              { label: 'Actual', value: `${summary.actual_day}d` },
              { label: 'Absent', value: `${summary.absent}d` },
              { label: 'OT', value: fmtMins(summary.over_time) ?? '0m' },
            ].map((s) => (
              <View key={s.label} style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{s.value}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={renderRecord}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={colors.gray300} />
              <Text style={styles.emptyText}>No records this month</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.white },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  navBtn: { padding: 4 },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    minWidth: 160,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  summaryItem: { alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: colors.white },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  list: { padding: spacing.lg, gap: 10 },
  recordCard: { gap: 8 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordDate: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  recordTimes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 13, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  workTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto' as any,
    backgroundColor: colors.infoLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  workTimeText: { fontSize: 12, color: colors.info, fontWeight: '600' },
  recordTags: { flexDirection: 'row', gap: 6 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
  },
  tagText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
});
