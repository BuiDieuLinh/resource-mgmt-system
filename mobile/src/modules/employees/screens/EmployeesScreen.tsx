import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, Searchbar } from 'react-native-paper';
import { apiClient } from '../../../lib/api';
import { Loading, ErrorState, EmptyState } from '../../../components';
import { Employee, GetEmployeesResponse } from '../../../models';

interface EmployeesScreenProps {
  navigation: any;
}

export const EmployeesScreen: React.FC<EmployeesScreenProps> = ({ navigation }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = employees.filter(
        (emp) =>
          emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchQuery, employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/employees');
      setEmployees(response.data);
      setFilteredEmployees(response.data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch employees';
      setError(message);
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderEmployee = ({ item }: { item: Employee }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.full_name}</Title>
        <Paragraph>{item.email}</Paragraph>
        {item.position && <Paragraph>Position: {item.position.name}</Paragraph>}
        {item.department && <Paragraph>Department: {item.department.name}</Paragraph>}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return <Loading message="Loading employees..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchEmployees} />;
  }

  if (filteredEmployees.length === 0 && !searchQuery) {
    return <EmptyState message="No employees found" />;
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search employees..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      {filteredEmployees.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Paragraph style={styles.emptyText}>No results found for "{searchQuery}"</Paragraph>
        </View>
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={(item) => item.id}
          renderItem={renderEmployee}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 8,
    elevation: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
  },
});
