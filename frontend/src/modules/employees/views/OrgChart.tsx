import { Stack, Card, Text, Group, Avatar, Badge, Box, Title } from '@mantine/core';
import { IconUser, IconBuilding } from '@tabler/icons-react';
import { useGetEmployees } from '../api/get-employees';
import { useGetAllDepartments } from '../../departments/api/get-departments';
import { Loading } from '../../../components/Loading/Loading';
import type { IEmployee } from '../types';
import './OrgChart.css';

interface DepartmentNode {
  id: string;
  name: string;
  employees: IEmployee[];
}

export default function OrgChartPage() {
  const { data: employeesData, isLoading: isLoadingEmployees } = useGetEmployees({
    pageIndex: 1,
    pageSize: 1000,
  });

  const { data: departmentsData, isLoading: isLoadingDepts } = useGetAllDepartments();

  const employees = employeesData?.data || [];
  const departments = departmentsData?.data || [];

  const buildDepartmentTree = (): DepartmentNode[] => {
    return departments.map((dept) => ({
      id: dept.id,
      name: dept.department_name,
      employees: employees.filter((emp) => emp.department_id === dept.id),
    }));
  };

  const deptTree = buildDepartmentTree();

  if (isLoadingEmployees || isLoadingDepts) return <Loading />;

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Stack gap={0}>
          <Title order={2} c="deepPurple">
            Organization Chart
          </Title>
          <Text size="sm" c="dimmed">
            Company organizational structure by department
          </Text>
        </Stack>

        <Group gap="md">
          <Badge size="lg" variant="light" color="deepPurple">
            {departments.length} Departments
          </Badge>
          <Badge size="lg" variant="light" color="green">
            {employees.length} Employees
          </Badge>
        </Group>
      </Group>

      <Box className="org-chart-container">
        <div className="org-tree">
          <div className="org-node root-node">
            <Card shadow="md" padding="md" radius="md" withBorder className="node-card">
              <Group gap="sm" wrap="nowrap">
                <Avatar size={40} radius="md" color="deepPurple">
                  <IconBuilding size={20} />
                </Avatar>
                <div>
                  <Text fw={700} size="md">
                    RMS Core
                  </Text>
                  <Text size="xs" c="dimmed">
                    Company
                  </Text>
                </div>
              </Group>
            </Card>
          </div>

          {deptTree.length > 0 && (
            <div className="org-level">
              {deptTree.map((dept) => (
                <div key={dept.id} className="org-branch">
                  <div className="org-node dept-node">
                    <Card shadow="sm" padding="xs" radius="md" withBorder className="node-card">
                      <Group gap="xs" wrap="nowrap">
                        <Avatar size={32} radius="md" color="blue" variant="light">
                          <IconBuilding size={16} />
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text fw={600} size="sm" lineClamp={1}>
                            {dept.name}
                          </Text>
                          <Badge size="xs" variant="dot">
                            {dept.employees.length}
                          </Badge>
                        </div>
                      </Group>
                    </Card>
                  </div>

                  {dept.employees.length > 0 && (
                    <div className="org-level employees-level">
                      {dept.employees.map((emp) => (
                        <EmployeeCard key={emp.id} employee={emp} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Box>
    </Stack>
  );
}

function EmployeeCard({ employee }: { employee: IEmployee }) {
  return (
    <div className="org-node employee-node">
      <Card shadow="sm" padding="xs" radius="md" withBorder className="node-card employee-card">
        <Group gap="xs" wrap="nowrap">
          <Avatar src={employee.avatar_url} size={28} radius="md" color="deepPurple">
            <IconUser size={14} />
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text fw={600} size="xs" lineClamp={1}>
              {employee.full_name}
            </Text>
            <Text size="10px" c="dimmed" lineClamp={1}>
              {(employee as any).position?.position_name || 'N/A'}
            </Text>
          </div>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: employee.status === 'active' ? '#51cf66' : '#868e96',
              flexShrink: 0,
            }}
          />
        </Group>
      </Card>
    </div>
  );
}
