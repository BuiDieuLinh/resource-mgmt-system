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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/api';
import { Card, Badge, Button } from '../../../components';
import { colors, gradients, spacing, radius, shadow } from '../../../theme';

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState('annual');

  const fetchRequests = async () => {
    try {
      const res = await apiClient.get('/leave-requests/my', {
        params: filterStatus ? { status: filterStatus } : {},
      });
      const data = res.data?.data ?? res.data;
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch leave requests error:', err);
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
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/leave-requests', {
        start_date: startDate,
        end_date: endDate,
        reason,
        leave_type: leaveType,
      });
      Alert.alert('✅ Submitted', 'Your leave request has been submitted successfully');
      setShowModal(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      setLeaveType('annual');
      fetchRequests();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
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
  ];

  const renderItem = ({ item, index }: { item: LeaveRequest; index: number }) => {
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
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <LinearGradient
        colors={gradients.primary}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
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
      </LinearGradient>

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
            <Text style={styles.fieldLabel}>Leave Type</Text>
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

            <Text style={styles.fieldLabel}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2026-05-01"
              placeholderTextColor={colors.gray400}
            />

            <Text style={styles.fieldLabel}>End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2026-05-03"
              placeholderTextColor={colors.gray400}
            />

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
