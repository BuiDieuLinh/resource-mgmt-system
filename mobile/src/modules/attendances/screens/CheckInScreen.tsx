import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { useAuth } from '@/hooks';
import { Card, Badge, Button, GradientHeader } from '@/components';
import { colors, gradients, spacing, shadow } from '@/theme';

import { useFaceCheckIn, useFaceCheckOut } from '../api/check-in-out';
import { useGetMyAttendance } from '../api/get-my-attendance';
import { useGetEmployeeByUser } from '@/modules/employees/api';
import { useI18n } from '@/i18n';

const formatTime = (iso: string | null | undefined, locale: string): string => {
  if (!iso) return '--:--';

  return new Date(iso).toLocaleTimeString(locale, {
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

const getMinutesInHoChiMinh = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');

  return hour * 60 + minute;
};

const getWorkDayInHoChiMinh = (date: Date) => {
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);

  const mapping: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };

  return mapping[weekday] ?? 0;
};

export const CheckInScreen: React.FC = () => {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraVisible, setCameraVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<'check-in' | 'check-out' | null>(null);

  const { data: employee } = useGetEmployeeByUser();
  const employeeData = employee?.data;

  const {
    data: record,
    isLoading,
    refetch,
  } = useGetMyAttendance(currentTime.getMonth() + 1, currentTime.getFullYear());

  const faceCheckInMutation = useFaceCheckIn();
  const faceCheckOutMutation = useFaceCheckOut();

  const loading = faceCheckInMutation.isPending || faceCheckOutMutation.isPending;

  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const todayRecord = record?.records?.find((r: any) => r.work_date?.split('T')[0] === today);
  const isCheckedIn = !!todayRecord?.check_in_time;
  const isCheckedOut = !!todayRecord?.check_out_time;
  const hasFaceDescriptor =
    Array.isArray(employeeData?.face_descriptor) && employeeData.face_descriptor.length === 128;
  const todayWorkDay = getWorkDayInHoChiMinh(currentTime);
  const todaySchedule = employeeData?.work_schedules?.find(
    (schedule) => schedule.day_of_week === todayWorkDay,
  );
  const currentMinutes = getMinutesInHoChiMinh(currentTime);
  const isPastCheckInTime =
    !isCheckedIn && !isCheckedOut && !!todaySchedule && currentMinutes > todaySchedule.end_time;
  const checkInDisabled = loading || isPastCheckInTime || !todaySchedule;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch()]);
    setRefreshing(false);
  };

  const openCameraForAction = async (action: 'check-in' | 'check-out') => {
    if (action === 'check-in' && isPastCheckInTime) {
      Alert.alert(t('attendance.pastHoursTitle'), t('attendance.pastHoursMessage'));
      return;
    }

    if (loading) return;

    if (!employeeData?.id) {
      Alert.alert(t('attendance.missingEmployee'), t('attendance.missingEmployeeMessage'));
      return;
    }

    if (action === 'check-in' && !todaySchedule) {
      Alert.alert(t('attendance.noSchedule'), t('attendance.noScheduleMessage'));
      return;
    }

    if (!hasFaceDescriptor) {
      Alert.alert(t('attendance.faceMissingTitle'), t('attendance.faceMissingMessage'));
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(t('attendance.cameraPermission'), t('attendance.cameraPermissionMessage'));
        return;
      }
    }

    setPendingAction(action);
    setCameraVisible(true);
  };

  const closeCamera = () => {
    if (loading) return;
    setCameraVisible(false);
    setPendingAction(null);
  };

  const submitFaceAttendance = async () => {
    if (!cameraRef.current || !pendingAction || !employeeData?.id) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        imageType: 'jpg',
      });

      if (!photo?.uri) {
        throw new Error(t('attendance.cameraRequired'));
      }

      const payload = {
        employee_id: employeeData.id,
        face_descriptor: employeeData.face_descriptor ?? [],
        selfieUri: photo.uri,
        timestamp: new Date().toISOString(),
      };

      const response =
        pendingAction === 'check-in'
          ? await faceCheckInMutation.mutateAsync(payload)
          : await faceCheckOutMutation.mutateAsync(payload);

      setCameraVisible(false);
      setPendingAction(null);
      await refetch();

      const title =
        pendingAction === 'check-in' ? t('attendance.checkIn') : t('attendance.checkOut');
      Alert.alert(title, response.message || t('attendance.faceSuccess'));
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || t('attendance.faceCheckFailed');
      Alert.alert(
        t('attendance.faceCheckFailed'),
        Array.isArray(message) ? message.join('\n') : message,
      );
    }
  };

  const handleCheckIn = async () => {
    await openCameraForAction('check-in');
  };

  const handleCheckOut = async () => {
    Alert.alert(t('attendance.checkOut'), t('attendance.checkOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.continue'),
        style: 'default',
        onPress: async () => {
          await openCameraForAction('check-out');
        },
      },
    ]);
  };

  const timeStr = currentTime.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const dateStr = currentTime.toLocaleDateString(locale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  const getStatusBadge = () => {
    if (isCheckedOut) {
      return <Badge label={t('attendance.completed')} variant="success" />;
    }

    if (isCheckedIn) {
      return <Badge label={t('home.working')} variant="info" />;
    }

    return <Badge label={t('home.notCheckedIn')} variant="default" />;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader style={styles.header}>
        <Text style={styles.greeting}>
          {currentTime.getHours() < 12
            ? t('home.morning')
            : currentTime.getHours() < 18
              ? t('home.afternoon')
              : t('home.evening')}
          , {user?.email?.split('@')[0] ?? 'there'} 👋
        </Text>

        <Text style={styles.clock}>{timeStr}</Text>
        <Text style={styles.date}>{dateStr}</Text>
        <View style={styles.statusRow}>{getStatusBadge()}</View>
        {isPastCheckInTime && (
          <Badge
            label={t('attendance.pastHoursBadge')}
            variant="error"
            style={styles.overtimeBadge}
          />
        )}
      </GradientHeader>

      <View style={styles.buttonSection}>
        {!isCheckedOut && (
          <TouchableOpacity
            onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
            disabled={isCheckedIn ? loading : checkInDisabled}
            activeOpacity={0.9}
            style={[
              styles.mainButtonWrapper,
              !isCheckedIn && checkInDisabled ? styles.mainButtonWrapperDisabled : null,
            ]}
          >
            <LinearGradient
              colors={isCheckedIn ? [colors.error, '#FF6B6B'] : gradients.primary}
              style={[
                styles.mainButton,
                !isCheckedIn && checkInDisabled ? styles.mainButtonDisabled : null,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons
                name={isCheckedIn ? 'scan-circle-outline' : 'scan-outline'}
                size={52}
                color={colors.white}
              />

              <Text style={styles.mainButtonText}>
                {loading
                  ? t('attendance.processing')
                  : isCheckedIn
                    ? t('attendance.faceCheckOut')
                    : isPastCheckInTime
                      ? t('attendance.checkInClosed')
                      : t('attendance.faceCheckIn')}
              </Text>

              <Text style={styles.mainButtonSub}>
                {isCheckedIn
                  ? t('attendance.captureEnd')
                  : isPastCheckInTime
                    ? t('attendance.pastHours')
                    : t('attendance.captureStart')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isCheckedOut && (
          <View style={styles.completedSection}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
            <Text style={styles.completedText}>{t('attendance.completed')}</Text>
            <Text style={styles.completedSub}>{t('home.shiftEnded')}</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {record && (
          <Card style={styles.statsCard}>
            <Text style={styles.statsTitle}>{t('attendance.summary')}</Text>

            <View style={styles.statsGrid}>
              <StatItem
                icon="log-in-outline"
                label={t('attendance.checkIn')}
                value={formatTime(todayRecord?.check_in_time, locale)}
                color={colors.success}
              />

              <StatItem
                icon="log-out-outline"
                label={t('attendance.checkOut')}
                value={formatTime(todayRecord?.check_out_time, locale)}
                color={colors.error}
              />

              <StatItem
                icon="time-outline"
                label={t('attendance.workTime')}
                value={formatMinutes(todayRecord?.work_minutes)}
                color={colors.info}
              />

              <StatItem
                icon="alert-circle-outline"
                label={t('attendance.late')}
                value={
                  todayRecord?.late && todayRecord.late > 0
                    ? formatMinutes(todayRecord.late)
                    : t('attendance.onTime')
                }
                color={todayRecord?.late && todayRecord.late > 0 ? colors.warning : colors.success}
              />
            </View>
          </Card>
        )}

        <Card variant="flat" style={styles.tipCard}>
          <View style={styles.tipRow}>
            <Ionicons
              name={isPastCheckInTime ? 'alert-circle-outline' : 'scan-circle-outline'}
              size={18}
              color={isPastCheckInTime ? colors.error : colors.primary}
            />
            <Text style={styles.tipText}>
              {isPastCheckInTime
                ? t('attendance.mobileLockedPastHours')
                : !todaySchedule
                  ? t('attendance.mobileLockedNoSchedule')
                  : t('attendance.tip')}
            </Text>
          </View>
        </Card>
      </ScrollView>

      <Modal visible={cameraVisible} animationType="slide" onRequestClose={closeCamera}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {pendingAction === 'check-out'
                ? t('attendance.faceCheckOut')
                : t('attendance.faceCheckIn')}
            </Text>
            <TouchableOpacity onPress={closeCamera} disabled={loading}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalHint}>{t('attendance.faceHint')}</Text>

          <View style={styles.cameraCard}>
            {permission?.granted ? (
              <CameraView ref={cameraRef} style={styles.camera} facing="front" mirror />
            ) : (
              <View style={styles.cameraFallback}>
                <Ionicons name="camera-outline" size={42} color={colors.gray500} />
                <Text style={styles.cameraFallbackText}>{t('attendance.cameraRequired')}</Text>
              </View>
            )}
          </View>

          <View style={styles.modalActions}>
            <Button
              title={t('common.cancel')}
              variant="outline"
              onPress={closeCamera}
              disabled={loading}
              style={styles.modalButton}
            />
            <Button
              title={loading ? t('attendance.verifying') : t('attendance.captureSubmit')}
              onPress={submitFaceAttendance}
              loading={loading}
              disabled={!permission?.granted}
              icon={<Ionicons name="camera-outline" size={18} color={colors.white} />}
              style={styles.modalButton}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
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
    <View
      style={[
        statStyles.iconBg,
        {
          backgroundColor: `${color}20`,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={color} />
    </View>

    <Text style={statStyles.label}>{label}</Text>
    <Text style={[statStyles.value, { color }]}>{value}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  item: {
    alignItems: 'center',
    flex: 1,
  },

  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  label: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },

  value: {
    fontSize: 14,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 20,
  },

  scroll: {
    paddingTop: 120,
    paddingBottom: 32,
  },

  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },

  clock: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },

  date: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  statusRow: {
    marginTop: spacing.md,
  },

  overtimeBadge: {
    marginTop: spacing.sm,
  },

  buttonSection: {
    position: 'absolute',
    top: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 100,
  },

  mainButtonWrapper: {
    ...shadow.lg,
    borderRadius: 80,
  },

  mainButtonWrapperDisabled: {
    opacity: 0.75,
  },

  mainButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  mainButtonDisabled: {
    backgroundColor: colors.gray400,
  },

  mainButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  mainButtonSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 18,
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

  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  modalHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },

  cameraCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.gray900,
    ...shadow.lg,
  },

  camera: {
    flex: 1,
  },

  cameraFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.gray100,
  },

  cameraFallbackText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.lg,
  },

  modalButton: {
    flex: 1,
  },
});
