import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks';
import { Card, GradientHeader } from '@/components';
import { colors, spacing, radius } from '@/theme';
import { getEmployeeByUser, useGetEmployeeByUser } from '../../employees/api';
import type { Employee } from '@/models/employees';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });

const contractTypeLabel: Record<string, string> = {
  intern: 'Intern',
  probation: 'Probation',
  official: 'Official',
  parttime: 'Part-time',
};

const levelLabel: Record<string, string> = {
  junior: 'Junior',
  mid: 'Mid-level',
  senior: 'Senior',
  lead: 'Lead',
  manager: 'Manager',
};

export const MyProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { data: employeeData, isLoading: loading, refetch } = useGetEmployeeByUser();
  const employee = employeeData?.data;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!employee) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = employee?.display_name || employee?.full_name;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      <GradientHeader style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userPosition}>
            {employee.position.position_name} • {levelLabel[employee.position.level]}
          </Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={styles.statusText}>{employee.status}</Text>
          </View>
        </View>
      </GradientHeader>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
      >
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.statValue}>{employee.annual_leave_days}</Text>
            <Text style={styles.statLabel}>Annual Days</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="briefcase-outline" size={20} color={colors.info} />
            <Text style={styles.statValue}>
              {employee.hire_date
                ? Math.floor(
                    (new Date().getTime() - new Date(employee.hire_date).getTime()) /
                      (1000 * 60 * 60 * 24 * 365),
                  )
                : 'Not provided'}
              y
            </Text>
            <Text style={styles.statLabel}>Experience</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="document-text-outline" size={20} color={colors.warning} />
            <Text style={styles.statValue}>{contractTypeLabel[employee.contract_type]}</Text>
            <Text style={styles.statLabel}>Contract</Text>
          </Card>
        </View>

        {/* Personal Information */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          <InfoRow icon="mail-outline" label="Email" value={employee.email} />
          <InfoRow icon="call-outline" label="Phone" value={employee.phone || 'Not provided'} />
          <InfoRow
            icon="male-female-outline"
            label="Gender"
            value={
              employee?.gender
                ? employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1)
                : 'Not provided'
            }
          />
          <InfoRow
            icon="calendar-outline"
            label="Date of Birth"
            value={formatDate(employee.date_of_birth || 'Not provided')}
          />
          <InfoRow
            icon="location-outline"
            label="Address"
            value={employee.address || 'Not provided'}
          />
        </Card>

        {/* Work Information */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase-outline" size={18} color={colors.info} />
            <Text style={styles.sectionTitle}>Work Information</Text>
          </View>
          <InfoRow icon="id-card-outline" label="Employee Code" value={employee.employee_code} />
          <InfoRow
            icon="business-outline"
            label="Department"
            value={employee.position.department.department_name}
          />
          <InfoRow icon="ribbon-outline" label="Position" value={employee.position.position_name} />
          <InfoRow
            icon="bar-chart-outline"
            label="Level"
            value={levelLabel[employee.position.level]}
          />
          <InfoRow
            icon="calendar-outline"
            label="Hire Date"
            value={formatDate(employee.hire_date || 'Not provided')}
          />
          {employee.manager && (
            <InfoRow icon="people-outline" label="Manager" value={employee.manager.full_name} />
          )}
        </Card>
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <View style={infoStyles.row}>
    <View style={infoStyles.left}>
      <Ionicons name={icon} size={16} color={colors.gray400} />
      <Text style={infoStyles.label}>{label}</Text>
    </View>
    <Text style={infoStyles.value}>{value}</Text>
  </View>
);

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  label: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  value: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontSize: 15, color: colors.error },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  retryText: { fontSize: 14, color: colors.white, fontWeight: '600' },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
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
  userName: { fontSize: 20, fontWeight: '700', color: colors.white },
  userPosition: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, color: colors.white, fontWeight: '600', textTransform: 'capitalize' },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  statsRow: { flexDirection: 'row', gap: 6 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 6 },
  statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  section: { gap: 0, marginTop: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
});
