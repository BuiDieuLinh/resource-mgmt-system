import { useState } from 'react';
import {
  Stack,
  Group,
  Button,
  Card,
  Text,
  Badge,
  Select,
  Textarea,
  Slider,
  Loader,
  Center,
  Grid,
  Divider,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconStar, IconCheck, IconInfoCircle } from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { useGetCycles, useGetReviewsByCycle, useCreateReview, useSubmitReview } from '../api';
import { useGetEmployees } from '@/modules/employees/api/get-employees';
import { useGetEmployeeByUserId } from '@/modules/employees/api/get-employee-by-user';
import { useAuthStore } from '@/stores/useAuthStore';
import { notify } from '@/components/Notification';

const STATUS_COLOR: Record<string, string> = {
  draft: 'gray',
  submitted: 'blue',
  published: 'green',
};
const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  published: 'Published',
};

export default function PerformanceReviewPage() {
  const { data: cycles = [] } = useGetCycles();
  const { data: employeesRes } = useGetEmployees({ pageSize: 200 });
  const employees = employeesRes?.data ?? [];

  const { user } = useAuthStore();
  const { data: myEmpData } = useGetEmployeeByUserId(user?.id);
  const myEmployeeId = myEmpData?.data?.id;

  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  const { data: reviews = [], isLoading: reviewsLoading } = useGetReviewsByCycle(
    selectedCycle ?? '',
  );
  const createReview = useCreateReview();
  const submitReview = useSubmitReview();

  const existingReview = reviews.find((r: any) => r.employee_id === selectedEmployee);

  const form = useForm({
    initialValues: { score: 70, comment: '', achievements: '' },
    validate: {
      score: (v) => (v < 1 || v > 100 ? 'Score must be 1-100' : null),
    },
  });

  const handleSelectEmployee = (empId: string | null) => {
    setSelectedEmployee(empId);
    const existing = reviews.find((r: any) => r.employee_id === empId);
    if (existing) {
      form.setValues({
        score: existing.score ?? 70,
        comment: existing.comment ?? '',
        achievements: existing.achievements ?? '',
      });
    } else {
      form.reset();
    }
  };

  const handleSave = async (submit = false) => {
    if (!selectedCycle || !selectedEmployee || !myEmployeeId) {
      notify.error('', {
        message: !myEmployeeId
          ? 'Your employee profile was not found'
          : 'Please fill in all required fields',
      });
      return;
    }
    const payload = {
      cycle_id: selectedCycle,
      employee_id: selectedEmployee,
      reviewer_id: myEmployeeId,
      ...form.values,
    };
    const nid = notify.loading(submit ? 'Submitting...' : 'Saving...');
    try {
      if (existingReview && submit) {
        await submitReview.mutateAsync({ id: existingReview.id, ...form.values });
      } else {
        await createReview.mutateAsync(payload);
        if (submit) {
          const updated = reviews.find((r: any) => r.employee_id === selectedEmployee);
          if (updated) await submitReview.mutateAsync({ id: updated.id, ...form.values });
        }
      }
      notify.success(nid, { message: submit ? 'Review submitted' : 'Draft saved' });
    } catch (e: any) {
      notify.error(nid, { message: e?.response?.data?.message || 'An error occurred' });
    }
  };

  const cycleOptions = cycles.map((c: any) => ({ value: c.id, label: c.title }));
  const employeeOptions = employees.map((e: any) => ({
    value: e.id,
    label: `${e.full_name} — ${e.position?.department?.department_name ?? ''}`,
  }));

  const scoreColor =
    form.values.score >= 85 ? 'green' : form.values.score >= 60 ? 'blue' : 'orange';

  return (
    <Stack gap="lg">
      <PageHeader title="Performance Review" description="Evaluate employees for a review cycle" />

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card withBorder radius="md" p="lg">
            <Stack gap="md">
              <Select
                label="Review Cycle"
                placeholder="Select cycle..."
                data={cycleOptions}
                value={selectedCycle}
                onChange={setSelectedCycle}
                required
              />

              <Select
                label="Employee"
                placeholder="Select employee..."
                data={employeeOptions}
                value={selectedEmployee}
                onChange={handleSelectEmployee}
                searchable
                allowDeselect={false}
                disabled={!selectedCycle}
                required
              />

              {existingReview && (
                <Alert
                  icon={<IconInfoCircle size={14} />}
                  color={STATUS_COLOR[existingReview.status]}
                  variant="light"
                >
                  Current status: <strong>{STATUS_LABEL[existingReview.status]}</strong>
                  {existingReview.status === 'published' && ' — Published, cannot be edited'}
                </Alert>
              )}

              <Divider label="Score (internal only)" labelPosition="left" />

              <Stack gap={4}>
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Score
                  </Text>
                  <Badge size="lg" color={scoreColor} variant="light">
                    <Group gap={4}>
                      <IconStar size={12} fill="currentColor" />
                      {form.values.score} / 100
                    </Group>
                  </Badge>
                </Group>
                <Slider
                  min={1}
                  max={100}
                  step={1}
                  color={scoreColor}
                  marks={[
                    { value: 25, label: '25' },
                    { value: 50, label: '50' },
                    { value: 75, label: '75' },
                    { value: 100, label: '100' },
                  ]}
                  disabled={existingReview?.status === 'published'}
                  {...form.getInputProps('score')}
                />
              </Stack>

              <Divider label="Feedback (visible to employee)" labelPosition="left" />

              <Textarea
                label="General feedback"
                placeholder="Performance, attitude, contributions..."
                rows={4}
                disabled={existingReview?.status === 'published'}
                {...form.getInputProps('comment')}
              />

              <Textarea
                label="Key achievements"
                placeholder="Outstanding work, notable projects..."
                rows={3}
                disabled={existingReview?.status === 'published'}
                {...form.getInputProps('achievements')}
              />

              {existingReview?.status !== 'published' && (
                <Group justify="flex-end" mt="sm">
                  <Button
                    variant="light"
                    disabled={!selectedCycle || !selectedEmployee}
                    loading={createReview.isPending}
                    onClick={() => handleSave(false)}
                  >
                    Save Draft
                  </Button>
                  <Button
                    leftSection={<IconCheck size={16} />}
                    disabled={!selectedCycle || !selectedEmployee}
                    loading={submitReview.isPending}
                    onClick={() => handleSave(true)}
                  >
                    Submit Review
                  </Button>
                </Group>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder radius="md" p="md">
            <Text fw={600} mb="md">
              Reviews in cycle {selectedCycle ? `(${reviews.length})` : ''}
            </Text>
            {!selectedCycle ? (
              <Text size="sm" c="dimmed">
                Select a cycle to see reviews
              </Text>
            ) : reviewsLoading ? (
              <Center h={100}>
                <Loader size="sm" />
              </Center>
            ) : reviews.length === 0 ? (
              <Text size="sm" c="dimmed">
                No reviews yet
              </Text>
            ) : (
              <Stack gap="xs">
                {reviews.map((r: any) => (
                  <Group
                    key={r.id}
                    justify="space-between"
                    p="xs"
                    style={{
                      borderRadius: 8,
                      background:
                        r.employee_id === selectedEmployee
                          ? 'var(--mantine-color-blue-0)'
                          : 'var(--mantine-color-gray-0)',
                      cursor: 'pointer',
                      border:
                        r.employee_id === selectedEmployee
                          ? '1px solid var(--mantine-color-blue-3)'
                          : '1px solid transparent',
                    }}
                    onClick={() => handleSelectEmployee(r.employee_id)}
                  >
                    <Stack gap={2}>
                      <Text size="sm" fw={500}>
                        {r.employee?.full_name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {r.employee?.position?.department?.department_name}
                      </Text>
                    </Stack>
                    <Group gap="xs">
                      <Badge size="xs" variant="light" color="blue">
                        <Group gap={2}>
                          <IconStar size={10} fill="currentColor" />
                          {r.score}
                        </Group>
                      </Badge>
                      <Badge size="xs" color={STATUS_COLOR[r.status]} variant="light">
                        {STATUS_LABEL[r.status]}
                      </Badge>
                    </Group>
                  </Group>
                ))}
              </Stack>
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
