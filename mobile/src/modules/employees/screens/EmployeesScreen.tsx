import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/lib/api';
import { Card } from '@/components';
import { colors, gradients, spacing, radius } from '@/theme';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  employee_code?: string;
  position?: { position_name: string; department?: { department_name: string } };
  status?: string;
}

export const EmployeesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(employees);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      employees.filter(
        (e) => e.full_name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q),
      ),
    );
  }, [search, employees]);

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/employees');
      const data = res.data?.data ?? res.data;
      const list = Array.isArray(data) ? data : [];
      setEmployees(list);
      setFiltered(list);
    } catch (err) {
      console.error('Fetch employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: { item: Employee; index: number }) => {
    const initials = item.full_name
      .trim()
      .split(' ')
      .slice(-2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
    return (
      <View>
        <Card style={styles.card} variant="outlined">
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              {item.position && (
                <Text style={styles.position}>
                  {item.position.position_name}
                  {item.position.department ? ` · ${item.position.department.department_name}` : ''}
                </Text>
              )}
            </View>
            {item.status === 'active' && <View style={styles.activeDot} />}
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
          <Text style={styles.headerTitle}>Employees</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.searchWrapper}>
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.gray400}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employees..."
            placeholderTextColor={colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={colors.gray300} />
              <Text style={styles.emptyText}>No employees found</Text>
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
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.textPrimary },
  list: { padding: spacing.lg, gap: 10 },
  card: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  email: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  position: { fontSize: 12, color: colors.primary, marginTop: 2 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
});
