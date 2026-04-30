import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Dialog,
  Portal,
  TextInput,
  Chip,
} from 'react-native-paper';
import { apiClient } from '../../../lib/api';
import { Loading, ErrorState, EmptyState } from '../../../components';
import { formatDate } from '../../../utils';
import { LeaveRequest, CreateLeaveRequestRequest, LeaveType } from '../../../models';

interface LeaveRequestsScreenProps {
  navigation: any;
}

export const LeaveRequestsScreen: React.FC<LeaveRequestsScreenProps> = ({ navigation }) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType | string>('annual');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/leave-requests');
      setLeaveRequests(response.data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch leave requests';
      setError(message);
      console.error('Failed to fetch leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!startDate || !endDate || !reason) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const leaveRequest: CreateLeaveRequestRequest = {
        start_date: startDate,
        end_date: endDate,
        reason,
        leave_type: leaveType,
      };

      await apiClient.post('/leave-requests', leaveRequest);

      Alert.alert('Success', 'Leave request submitted!');
      setDialogVisible(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      setLeaveType('annual');
      await fetchLeaveRequests();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit request';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      case 'pending':
        return '#ff9800';
      default:
        return '#999';
    }
  };

  const renderLeaveRequest = ({ item }: { item: LeaveRequest }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title>{item.leave_type} Leave</Title>
          <Chip
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: 'white' }}
          >
            {item.status}
          </Chip>
        </View>
        <Paragraph>From: {formatDate(item.start_date)}</Paragraph>
        <Paragraph>To: {formatDate(item.end_date)}</Paragraph>
        <Paragraph>Reason: {item.reason}</Paragraph>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return <Loading message="Loading leave requests..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchLeaveRequests} />;
  }

  if (leaveRequests.length === 0) {
    return (
      <EmptyState
        message="No leave requests found"
        onAction={() => setDialogVisible(true)}
        actionLabel="Create Request"
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={leaveRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderLeaveRequest}
        contentContainerStyle={styles.list}
      />

      <FAB icon="plus" style={styles.fab} onPress={() => setDialogVisible(true)} />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Submit Leave Request</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Start Date (YYYY-MM-DD)"
              value={startDate}
              onChangeText={setStartDate}
              style={styles.input}
              editable={!submitting}
            />
            <TextInput
              label="End Date (YYYY-MM-DD)"
              value={endDate}
              onChangeText={setEndDate}
              style={styles.input}
              editable={!submitting}
            />
            <TextInput
              label="Reason"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              style={styles.input}
              editable={!submitting}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onPress={handleSubmitRequest} loading={submitting}>
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 16,
  },
});
