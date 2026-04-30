import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Button, Text } from 'react-native-paper';
import { apiClient } from '../../../lib/api';
import { Loading, ErrorState } from '../../../components';
import { formatDate, formatTime } from '../../../utils';
import { Attendance, CheckInResponse, CheckOutResponse } from '../../../models';
import { useAuth } from '../../../hooks';

interface AttendancesScreenProps {
  navigation: any;
}

export const AttendancesScreen: React.FC<AttendancesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.get('/attendances/my', {
        params: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
      });
      const records = response.data?.data?.records ?? response.data?.records ?? [];
      const todayRecord = records.find((r: any) => r.work_date?.startsWith(today));
      setTodayAttendance(todayRecord ?? null);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch attendance';
      setError(message);
      console.error('Failed to fetch attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      await apiClient.post('/attendances/check-in', { employee_id: user?.id });
      Alert.alert('Success', 'Checked in successfully!');
      await fetchTodayAttendance();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to check in';
      Alert.alert('Error', message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      await apiClient.post('/attendances/check-out', { employee_id: user?.id });
      Alert.alert('Success', 'Checked out successfully!');
      await fetchTodayAttendance();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to check out';
      Alert.alert('Error', message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading attendance..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchTodayAttendance} />;
  }

  const isCheckedIn = !!todayAttendance?.check_in_time;
  const isCheckedOut = !!todayAttendance?.check_out_time;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title style={styles.title}>Today's Attendance</Title>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.date}>Date: {formatDate(new Date())}</Text>

            {todayAttendance ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Check-in:</Text>
                  <Text style={styles.value}>
                    {isCheckedIn ? formatTime(todayAttendance.check_in_time!) : 'Not checked in'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Check-out:</Text>
                  <Text style={styles.value}>
                    {isCheckedOut ? formatTime(todayAttendance.check_out_time!) : 'Not checked out'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>Status:</Text>
                  <Text style={[styles.value, { color: getStatusColor(todayAttendance.status) }]}>
                    {todayAttendance.status}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.noData}>No attendance record for today</Text>
            )}
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleCheckIn}
            loading={actionLoading}
            disabled={actionLoading || isCheckedIn}
            style={styles.button}
          >
            Check In
          </Button>

          <Button
            mode="contained"
            onPress={handleCheckOut}
            loading={actionLoading}
            disabled={actionLoading || !isCheckedIn || isCheckedOut}
            style={styles.button}
          >
            Check Out
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'present':
    case 'checked-in':
      return '#4caf50';
    case 'absent':
      return '#f44336';
    case 'late':
      return '#ff9800';
    default:
      return '#666';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 24,
  },
  card: {
    marginBottom: 20,
    elevation: 2,
  },
  date: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  button: {
    flex: 1,
  },
});
