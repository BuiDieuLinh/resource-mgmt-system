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
import LabelValue from '../components/LabelValue';

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
                <LabelValue label="Employee Code" value={employee.employee_code} />
              </Grid.Col>
              <Grid.Col span={6}>
                <LabelValue
                  label="Gender"
                  value={employee.gender || 'Not specified'}
                  icon={getGenderIcon(employee.gender!)}
                />
              </Grid.Col>
              {employee.date_of_birth && (
                <Grid.Col span={6}>
                  <LabelValue
                    label="Date of Birth"
                    value={formatDate(employee.date_of_birth)}
                    icon={<IconCalendar size={16} />}
                  />
                </Grid.Col>
              )}
              <Grid.Col span={6}>
                <LabelValue
                  label="Hire Date"
                  value={formatDate(employee.hire_date)}
                  icon={<IconCalendar size={16} />}
                />
              </Grid.Col>
            </Grid>
          </Card>

          <Card withBorder padding="lg" radius="md" mt="md">
            <Text size="lg" fw={600} mb="md">
              Work Information
            </Text>
            <Grid gutter="md">
              <Grid.Col span={6}>
                <LabelValue
                  label="Department"
                  value={employee.position.department?.department_name || 'Not assigned'}
                  icon={<IconBuilding size={16} />}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <LabelValue
                  label="Position"
                  value={employee.position?.position_name || 'Not assigned'}
                  icon={<IconBriefcase size={16} />}
                />
              </Grid.Col>
              {employee.position?.level && (
                <Grid.Col span={6}>
                  <LabelValue
                    label="Level"
                    value={
                      <Badge variant="light" color="blue">
                        {employee.position.level}
                      </Badge>
                    }
                  />
                </Grid.Col>
              )}
            </Grid>
          </Card>

          {(employee.position?.description || employee.position?.department?.description) && (
            <Card withBorder padding="lg" radius="md" mt="md">
              <Text size="lg" fw={600} mb="md">
                Additional Information
              </Text>
              <Stack gap="md">
                {employee.position?.description && (
                  <LabelValue label="Position Description" value={employee.position.description} />
                )}
                {employee.position.department?.description && (
                  <LabelValue
                    label="Department Description"
                    value={employee.position.department.description}
                  />
                )}
              </Stack>
            </Card>
          )}
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
