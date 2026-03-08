import {
  Stack,
  Group,
  Card,
  Avatar,
  Text,
  Badge,
  Grid,
  Button,
  ActionIcon,
  Title,
} from '@mantine/core';
import {
  IconMail,
  IconPhone,
  IconId,
  IconCalendar,
  IconBuilding,
  IconBriefcase,
  IconGenderMale,
  IconGenderFemale,
  IconArrowLeft,
  IconEdit,
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetEmployee } from '../api/get-employee';
import { Loading } from '../../../components/Loading/Loading';
import ErrorState from '../../../components/ErrorState/ErrorState';
import { employeeListUrl } from '../../../routes/url';

export default function EmployeeProfile() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error, refetch } = useGetEmployee(id!);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <ErrorState message={`Error loading employee profile: ${error.message}`} onRetry={refetch} />
    );
  }

  if (!data?.data) {
    return <ErrorState message="Employee not found" onRetry={() => navigate(employeeListUrl)} />;
  }

  const employee = data.data;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getGenderIcon = (gender: string) => {
    return gender === 'Male' ? (
      <IconGenderMale size={16} />
    ) : gender === 'Female' ? (
      <IconGenderFemale size={16} />
    ) : null;
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group>
          <ActionIcon variant="light" size="lg" onClick={() => navigate(employeeListUrl)}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Title order={2}>Employee Profile</Title>
        </Group>
        <Button
          leftSection={<IconEdit size={16} />}
          variant="light"
          onClick={() => navigate(`/employees/${id}/edit`)}
        >
          Edit Profile
        </Button>
      </Group>

      <Grid gutter="md">
        <Grid.Col span={4}>
          <Card withBorder padding="lg" radius="md">
            <Stack align="center" gap="md">
              <Avatar
                src={employee.avatar_url}
                size={120}
                radius="50%"
                alt={`${employee.full_name} avatar`}
              />
              <Stack align="center" gap="xs">
                <Text size="xl" fw={700} ta="center">
                  {employee.full_name}
                </Text>
                {employee.display_name && (
                  <Text size="sm" c="dimmed">
                    {employee.display_name}
                  </Text>
                )}

                <Badge
                  variant="light"
                  color={employee.status === 'active' ? 'green' : 'gray'}
                  size="lg"
                >
                  {employee.status}
                </Badge>
              </Stack>
            </Stack>
          </Card>

          <Card withBorder padding="md" radius="md" mt="md">
            <Stack gap="sm">
              <Text size="sm" fw={600} c="dimmed">
                CONTACT INFORMATION
              </Text>
              <Group gap="xs">
                <IconMail size={16} />
                <Text size="sm">{employee.email}</Text>
              </Group>
              {employee.phone && (
                <Group gap="xs">
                  <IconPhone size={16} />
                  <Text size="sm">{employee.phone}</Text>
                </Group>
              )}
              <Group gap="xs">
                <IconId size={16} />
                <Text size="sm">{employee.identify_card}</Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={8}>
          <Card withBorder padding="lg" radius="md">
            <Text size="lg" fw={600} mb="md">
              Personal Information
            </Text>
            <Grid gutter="md">
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    Employee Code
                  </Text>
                  <Text fw={500}>{employee.employee_code}</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    Gender
                  </Text>
                  <Group gap="xs">
                    {getGenderIcon(employee.gender!)}
                    <Text fw={500}>{employee.gender || 'Not specified'}</Text>
                  </Group>
                </Stack>
              </Grid.Col>
              {employee.date_of_birth && (
                <Grid.Col span={6}>
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">
                      Date of Birth
                    </Text>
                    <Group gap="xs">
                      <IconCalendar size={16} />
                      <Text fw={500}>{formatDate(employee.date_of_birth)}</Text>
                    </Group>
                  </Stack>
                </Grid.Col>
              )}
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    Hire Date
                  </Text>
                  <Group gap="xs">
                    <IconCalendar size={16} />
                    <Text fw={500}>{formatDate(employee.hire_date)}</Text>
                  </Group>
                </Stack>
              </Grid.Col>
            </Grid>
          </Card>

          <Card withBorder padding="lg" radius="md" mt="md">
            <Text size="lg" fw={600} mb="md">
              Work Information
            </Text>
            <Grid gutter="md">
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    Department
                  </Text>
                  <Group gap="xs">
                    <IconBuilding size={16} />
                    <Text fw={500}>{employee.department?.department_name || 'Not assigned'}</Text>
                  </Group>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    Position
                  </Text>
                  <Group gap="xs">
                    <IconBriefcase size={16} />
                    <Text fw={500}>{employee.position?.position_name || 'Not assigned'}</Text>
                  </Group>
                </Stack>
              </Grid.Col>
              {employee.position?.level && (
                <Grid.Col span={6}>
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">
                      Level
                    </Text>
                    <Badge variant="light" color="blue">
                      {employee.position.level}
                    </Badge>
                  </Stack>
                </Grid.Col>
              )}
            </Grid>
          </Card>

          {(employee.position?.description || employee.department?.description) && (
            <Card withBorder padding="lg" radius="md" mt="md">
              <Text size="lg" fw={600} mb="md">
                Additional Information
              </Text>
              <Stack gap="md">
                {employee.position?.description && (
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">
                      Position Description
                    </Text>
                    <Text size="sm">{employee.position.description}</Text>
                  </div>
                )}
                {employee.department?.description && (
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">
                      Department Description
                    </Text>
                    <Text size="sm">{employee.department.description}</Text>
                  </div>
                )}
              </Stack>
            </Card>
          )}
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
