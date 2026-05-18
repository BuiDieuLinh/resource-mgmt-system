import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Badge, GradientHeader } from '@/components';
import { colors, spacing, radius } from '@/theme';

import { useGetMyAttendance } from '../api/get-my-attendance';

import type { IAttendance } from '@/models/attendances';

const formatTime = (iso?: string | null) => {
  if (!iso) return '--:--';

  return new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
};

const formatMinutes = (mins?: number) => {
  if (!mins || mins <= 0) return null;

  const h = Math.floor(mins / 60);
  const m = mins % 60;

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;

  return `${h}h ${m}m`;
};

const statusConfig: Record<
  string,
  {
    label: string;
    variant: any;
  }
> = {
  approved: {
    label: 'Approved',
    variant: 'success',
  },
  pending: {
    label: 'Pending',
    variant: 'warning',
  },
  rejected: {
    label: 'Rejected',
    variant: 'error',
  },
};

export const TimesheetScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const month = selectedMonth.getMonth() + 1;

  const year = selectedMonth.getFullYear();

  const { data, isLoading, isRefetching, refetch } = useGetMyAttendance(month, year);

  const records: IAttendance[] = data?.records ?? [];

  const summary = data?.summary;

  const prevMonth = () => {
    const d = new Date(selectedMonth);

    d.setMonth(d.getMonth() - 1);

    setSelectedMonth(d);
  };

  const nextMonth = () => {
    const d = new Date(selectedMonth);

    d.setMonth(d.getMonth() + 1);

    if (d <= new Date()) {
      setSelectedMonth(d);
    }
  };

  const monthLabel = selectedMonth.toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  const renderRecord = ({ item }: { item: IAttendance }) => {
    const cfg = statusConfig[item.status ?? 'pending'];

    const dayLabel = new Date(item.work_date).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });

    return (
      <Card style={styles.recordCard} variant="outlined">
        {/* Header */}
        <View style={styles.recordHeader}>
          <Text style={styles.recordDate}>{dayLabel}</Text>

          <Badge label={cfg.label} variant={cfg.variant} size="sm" />
        </View>

        {/* Time */}
        <View style={styles.recordTimes}>
          <View style={styles.timeItem}>
            <Ionicons name="log-in-outline" size={14} color={colors.success} />

            <Text style={styles.timeText}>{formatTime(item.check_in_time)}</Text>
          </View>

          <Ionicons name="arrow-forward" size={12} color={colors.gray400} />

          <View style={styles.timeItem}>
            <Ionicons name="log-out-outline" size={14} color={colors.error} />

            <Text style={styles.timeText}>{formatTime(item.check_out_time)}</Text>
          </View>

          {item.work_minutes ? (
            <View style={styles.workTime}>
              <Ionicons name="time-outline" size={12} color={colors.info} />

              <Text style={styles.workTimeText}>{formatMinutes(item.work_minutes)}</Text>
            </View>
          ) : null}
        </View>

        {/* Tags */}
        <View style={styles.recordTags}>
          {item.late && item.late > 0 ? (
            <View style={styles.tag}>
              <Text
                style={[
                  styles.tagText,
                  {
                    color: colors.warning,
                  },
                ]}
              >
                Late {formatMinutes(item.late)}
              </Text>
            </View>
          ) : null}

          {item.overtime && item.overtime > 0 ? (
            <View style={styles.tag}>
              <Text
                style={[
                  styles.tagText,
                  {
                    color: colors.info,
                  },
                ]}
              >
                OT + {formatMinutes(item.overtime)}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>My Timesheet</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Month Navigator */}
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
              {
                label: 'Planned',
                value: `${summary.plan_day}d`,
              },
              {
                label: 'Actual',
                value: `${summary.actual_day}d`,
              },
              {
                label: 'Absent',
                value: `${summary.absent}d`,
              },
              {
                label: 'OT',
                value: formatMinutes(summary.over_time) ?? '0m',
              },
            ].map((s) => (
              <View key={s.label} style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{s.value}</Text>

                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
      </GradientHeader>

      {/* Records */}
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={renderRecord}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={colors.gray300} />

            <Text style={styles.emptyText}>No records this month</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },

  navBtn: {
    padding: 4,
  },

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

  summaryItem: {
    alignItems: 'center',
    gap: 2,
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },

  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },

  list: {
    padding: spacing.lg,
    gap: 10,
  },

  recordCard: {
    gap: 8,
    marginBottom: 10,
  },

  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  recordDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  recordTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  timeText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },

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

  workTimeText: {
    fontSize: 12,
    color: colors.info,
    fontWeight: '600',
  },

  recordTags: {
    flexDirection: 'row',
    gap: 6,
  },

  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
  },

  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },

  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },

  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
