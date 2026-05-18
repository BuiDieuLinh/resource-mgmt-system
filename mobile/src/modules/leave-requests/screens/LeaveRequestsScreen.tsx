import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { Card, Badge, Button, GradientHeader } from '@/components';
import { colors, spacing, radius } from '@/theme';
import { getMyLeaveRequests, createLeaveRequest } from '../api';
import type { LeaveRequest } from '@/models/leave-requests';
import { useGetEmployeeByUser } from '@/modules/employees/api';

const statusConfig = {
  pending: { label: 'Pending', variant: 'warning' as const, icon: 'time-outline' },
  approved: { label: 'Approved', variant: 'success' as const, icon: 'checkmark-circle-outline' },
  rejected: { label: 'Rejected', variant: 'error' as const, icon: 'close-circle-outline' },
};

const leaveTypeLabel: Record<string, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  maternity: 'Maternity',
  paternity: 'Paternity',
  unpaid: 'Unpaid Leave',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });

export const LeaveRequestsScreen: React.FC<{ navigation: any }> = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Form state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [leaveStartTime, setLeaveStartTime] = useState('');
  const [leaveEndTime, setLeaveEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState('annual');
  const { data: employee } = useGetEmployeeByUser();

  const fetchRequests = async () => {
    try {
      const response = await getMyLeaveRequests(filterStatus || undefined);
      const data = response.data;
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[LeaveRequests] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason) {
      Alert.alert('Missing Fields', 'Please fill in Start Date, End Date, and Reason');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const payload: any = {
        employee_id: employee?.data?.id ?? '',
        start_date: startDate,
        end_date: endDate,
        reason,
        leave_type: leaveType as any,
      };

      if (leaveStartTime) {
        payload.leave_start_minutes = parseInt(leaveStartTime);
      }
      if (leaveEndTime) {
        payload.leave_end_minutes = parseInt(leaveEndTime);
      }

      await createLeaveRequest(payload);
      console.log('[LeaveRequest] Success');

      Alert.alert('✅ Submitted', 'Your leave request has been submitted successfully');
      setShowModal(false);
      setStartDate('');
      setEndDate('');
      setLeaveStartTime('');
      setLeaveEndTime('');
      setReason('');
      setLeaveType('annual');
      await fetchRequests();
    } catch (err: any) {
      console.error('[LeaveRequest] Error:', err);
      const message = err.response?.data?.message || err.message || 'Failed to submit';
      Alert.alert('Submission Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const filters = [
    { label: 'All', value: null },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const leaveTypes = [
    { label: 'Annual', value: 'annual' },
    { label: 'Sick', value: 'sick' },
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Maternity', value: 'maternity' },
    { label: 'Paternity', value: 'paternity' },
  ];

  // Time options (in minutes from midnight)
  const timeOptions = [
    { label: 'Full Day', value: '' },
    { label: '08:00', value: '480' },
    { label: '08:30', value: '510' },
    { label: '09:00', value: '540' },
    { label: '09:30', value: '570' },
    { label: '10:00', value: '600' },
    { label: '10:30', value: '630' },
    { label: '11:00', value: '660' },
    { label: '11:30', value: '690' },
    { label: '12:00', value: '720' },
    { label: '12:30', value: '750' },
    { label: '13:00', value: '780' },
    { label: '13:30', value: '810' },
    { label: '14:00', value: '840' },
    { label: '14:30', value: '870' },
    { label: '15:00', value: '900' },
    { label: '15:30', value: '930' },
    { label: '16:00', value: '960' },
    { label: '16:30', value: '990' },
    { label: '17:00', value: '1020' },
    { label: '17:30', value: '1050' },
    { label: '18:00', value: '1080' },
  ];

  const renderItem = ({ item }: { item: LeaveRequest }) => {
    const cfg = statusConfig[item.status] ?? statusConfig.pending;
    return (
      <View>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.leaveTypeRow}>
              <View style={styles.leaveTypeIcon}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.leaveType}>
                {leaveTypeLabel[item.leave_type] ?? item.leave_type}
              </Text>
            </View>
            <Badge label={cfg.label} variant={cfg.variant} size="sm" />
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-clear-outline" size={14} color={colors.gray400} />
            <Text style={styles.dateText}>
              {formatDate(item.start_date)} → {formatDate(item.end_date)}
            </Text>
          </View>
          {item.reason && (
            <Text style={styles.reason} numberOfLines={2}>
              {item.reason}
            </Text>
          )}
          <Text style={styles.createdAt}>Submitted {formatDate(item.created_at)}</Text>
        </Card>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Leave Requests</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {filters.map((f) => (
            <TouchableOpacity
              key={String(f.value)}
              style={[styles.filterChip, filterStatus === f.value && styles.filterChipActive]}
              onPress={() => setFilterStatus(f.value)}
            >
              <Text
                style={[styles.filterText, filterStatus === f.value && styles.filterTextActive]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </GradientHeader>

      {/* List */}
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onRefresh={() => {
          setRefreshing(true);
          fetchRequests();
        }}
        refreshing={refreshing}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={colors.gray300} />
              <Text style={styles.emptyText}>No leave requests found</Text>
            </View>
          ) : null
        }
      />

      {/* New Request Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Leave Request</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Leave type */}
            <Text style={styles.fieldLabel}>Leave Type *</Text>
            <View style={styles.typeRow}>
              {leaveTypes.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeChip, leaveType === t.value && styles.typeChipActive]}
                  onPress={() => setLeaveType(t.value)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      leaveType === t.value && styles.typeChipTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Start Date *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowStartCalendar(!showStartCalendar)}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={[styles.dateInputText, !startDate && styles.placeholderText]}>
                {startDate ? formatDisplayDate(startDate) : 'Select start date'}
              </Text>
              <Ionicons
                name={showStartCalendar ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.gray400}
              />
            </TouchableOpacity>
            {showStartCalendar && (
              <Calendar
                current={startDate || getTodayString()}
                minDate={getTodayString()}
                onDayPress={(day: any) => {
                  setStartDate(day.dateString);
                  setShowStartCalendar(false);
                  // Reset end date if it's before new start date
                  if (endDate && day.dateString > endDate) {
                    setEndDate('');
                  }
                }}
                markedDates={{
                  [startDate]: {
                    selected: true,
                    selectedColor: colors.primary,
                  },
                }}
                theme={{
                  todayTextColor: colors.primary,
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: colors.white,
                  arrowColor: colors.primary,
                  monthTextColor: colors.textPrimary,
                  textMonthFontWeight: '700',
                }}
                style={styles.calendar}
              />
            )}

            <Text style={styles.fieldLabel}>End Date *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowEndCalendar(!showEndCalendar)}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={[styles.dateInputText, !endDate && styles.placeholderText]}>
                {endDate ? formatDisplayDate(endDate) : 'Select end date'}
              </Text>
              <Ionicons
                name={showEndCalendar ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.gray400}
              />
            </TouchableOpacity>
            {showEndCalendar && (
              <Calendar
                current={endDate || startDate || getTodayString()}
                minDate={startDate || getTodayString()}
                onDayPress={(day: any) => {
                  setEndDate(day.dateString);
                  setShowEndCalendar(false);
                }}
                markedDates={{
                  [endDate]: {
                    selected: true,
                    selectedColor: colors.primary,
                  },
                }}
                theme={{
                  todayTextColor: colors.primary,
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: colors.white,
                  arrowColor: colors.primary,
                  monthTextColor: colors.textPrimary,
                  textMonthFontWeight: '700',
                }}
                style={styles.calendar}
              />
            )}

            <Text style={styles.fieldLabel}>Leave From (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
              {timeOptions.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.timeChip, leaveStartTime === t.value && styles.timeChipActive]}
                  onPress={() => setLeaveStartTime(t.value)}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      leaveStartTime === t.value && styles.timeChipTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Leave Until (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
              {timeOptions.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.timeChip, leaveEndTime === t.value && styles.timeChipActive]}
                  onPress={() => setLeaveEndTime(t.value)}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      leaveEndTime === t.value && styles.timeChipTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Reason *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Please provide a reason for your leave..."
              placeholderTextColor={colors.gray400}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Button
              title={submitting ? 'Submitting...' : 'Submit Request'}
              onPress={handleSubmit}
              loading={submitting}
              fullWidth
              size="lg"
              style={styles.submitBtn}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.white },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: { flexDirection: 'row' },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  filterChipActive: { backgroundColor: colors.white },
  filterText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  filterTextActive: { color: colors.primary, fontWeight: '700' },
  list: { padding: spacing.lg, gap: 12 },
  card: { gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leaveTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leaveTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveType: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 13, color: colors.textSecondary },
  reason: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  createdAt: { fontSize: 11, color: colors.gray400 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  modalBody: { padding: spacing.lg },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: spacing.md,
  },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  typeChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  typeChipTextActive: { color: colors.primary, fontWeight: '700' },
  timeScroll: { marginBottom: 8 },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  timeChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  timeChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  timeChipTextActive: { color: colors.primary, fontWeight: '700' },
  dateInput: {
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateInputText: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: colors.gray400,
  },
  calendar: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textarea: { height: 100, paddingTop: 14 },
  submitBtn: { marginTop: spacing.xl, marginBottom: spacing.xl },
});
