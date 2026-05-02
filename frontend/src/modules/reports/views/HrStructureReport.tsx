import { useState, useEffect } from 'react';
import { Stack, Paper, Title, Text, Tabs, Group, Loader, Center } from '@mantine/core';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { IconUsers } from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { getHrStructure } from '../api/hr-reports';
import type { HrStructureResponse } from '../api/hr-reports';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#82CA9D',
  '#FFC658',
  '#FF6B9D',
];

export default function HrStructureReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HrStructureResponse | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getHrStructure();
      setData(result.data);
    } catch (error) {
      console.error('Failed to load HR structure report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!data) {
    return (
      <Center h={400}>
        <Text c="dimmed">Không có dữ liệu</Text>
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <PageHeader title="HR Structure Report" />

      {/* Total Employees Card */}
      <Paper shadow="sm" p="md" withBorder>
        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">
              Total Employees
            </Text>
            <Title order={2}>{data.totalEmployees}</Title>
            <Text size="xs" c="dimmed">
              Active employees
            </Text>
          </div>
          <IconUsers size={48} stroke={1.5} color="var(--mantine-color-blue-6)" />
        </Group>
      </Paper>

      {/* Charts */}
      <Tabs defaultValue="department">
        <Tabs.List>
          <Tabs.Tab value="department">By Department</Tabs.Tab>
          <Tabs.Tab value="age">By Age</Tabs.Tab>
          <Tabs.Tab value="gender">By Gender</Tabs.Tab>
          <Tabs.Tab value="tenure">By Tenure</Tabs.Tab>
          <Tabs.Tab value="contract">By Contract Type</Tabs.Tab>
        </Tabs.List>

        {/* By Department */}
        <Tabs.Panel value="department" pt="md">
          <Paper shadow="sm" p="md" withBorder>
            <Title order={4} mb="md">
              Distribution by Department
            </Title>
            <Text size="sm" c="dimmed" mb="lg">
              Number of employees in each department
            </Text>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.byDepartment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="departmentName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="employeeCount" fill="#0088FE" name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Tabs.Panel>

        {/* By Age */}
        <Tabs.Panel value="age" pt="md">
          <Paper shadow="sm" p="md" withBorder>
            <Title order={4} mb="md">
              Distribution by Age
            </Title>
            <Text size="sm" c="dimmed" mb="lg">
              Employee structure by age group
            </Text>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={data.byAge}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) =>
                    `${entry.ageGroup}: ${entry.employeeCount} (${entry.percentage.toFixed(1)}%)`
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="employeeCount"
                >
                  {data.byAge.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Tabs.Panel>

        {/* By Gender */}
        <Tabs.Panel value="gender" pt="md">
          <Paper shadow="sm" p="md" withBorder>
            <Title order={4} mb="md">
              Distribution by Gender
            </Title>
            <Text size="sm" c="dimmed" mb="lg">
              Male/Female ratio in the company
            </Text>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={data.byGender}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) =>
                    `${entry.gender}: ${entry.employeeCount} (${entry.percentage.toFixed(1)}%)`
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="employeeCount"
                >
                  {data.byGender.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Tabs.Panel>

        {/* By Tenure */}
        <Tabs.Panel value="tenure" pt="md">
          <Paper shadow="sm" p="md" withBorder>
            <Title order={4} mb="md">
              Distribution by Tenure
            </Title>
            <Text size="sm" c="dimmed" mb="lg">
              Number of employees by years of service
            </Text>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.byTenure}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tenureGroup" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="employeeCount" fill="#00C49F" name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Tabs.Panel>

        {/* By Contract */}
        <Tabs.Panel value="contract" pt="md">
          <Paper shadow="sm" p="md" withBorder>
            <Title order={4} mb="md">
              Distribution by Contract Type
            </Title>
            <Text size="sm" c="dimmed" mb="lg">
              Employee structure by contract type
            </Text>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={data.byContract}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) =>
                    `${entry.contractType}: ${entry.employeeCount} (${entry.percentage.toFixed(1)}%)`
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="employeeCount"
                >
                  {data.byContract.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
