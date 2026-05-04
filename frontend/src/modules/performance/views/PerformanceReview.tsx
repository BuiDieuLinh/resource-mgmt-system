import { useState, useEffect, useMemo } from 'react';
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
  Alert,
  Paper,
  ThemeIcon,
  Progress,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconStar,
  IconCheck,
  IconInfoCircle,
  IconChartBar,
  IconFileText,
} from '@tabler/icons-react';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import {
  useGetCycles,
  useGetReviewsByCycle,
  useCreateReview,
  useSubmitReview,
  useGetTemplate,
} from '../api';
import { useGetEmployees } from '@/modules/employees/api/get-employees';
import { useGetEmployeeByUserId } from '@/modules/employees/api/get-employee-by-user';
import { useAuthStore } from '@/stores/useAuthStore';
import { notify } from '@/components/Notification';
import {
  REVIEW_STATUS_COLOR,
  REVIEW_STATUS_LABEL,
  PROBATION_RESULT_LABEL,
  INTERN_RESULT_LABEL,
} from '@/constant';
import type { IEvaluationCriteria } from '../types';

interface CriteriaScore {
  criteria_id: string;
  score: number;
  note: string;
}

interface FormValues {
  score: number;
  comment: string;
  achievements: string;
  result: string;
  criteriaScores: CriteriaScore[];
}

function buildCriteriaScores(criteria: IEvaluationCriteria[]): CriteriaScore[] {
  return criteria.map((c) => ({
    criteria_id: c.id,
    score: Math.floor(c.max_score / 2),
    note: '',
  }));
}

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

  const selectedCycleData = cycles.find((c: any) => c.id === selectedCycle);
  const { data: templateData } = useGetTemplate(selectedCycleData?.template_id ?? '');
  const template = selectedCycleData?.template_id ? templateData : null;

  const createReview = useCreateReview();
  const submitReview = useSubmitReview();

  const existingReview = reviews.find((r: any) => r.employee_id === selectedEmployee);
  const isPublished = existingReview?.status === 'published';

  const selectedEmp = employees.find((e: any) => e.id === selectedEmployee);
  const contractType = selectedEmp?.contract_type;

  const form = useForm<FormValues>({
    initialValues: {
      score: 70,
      comment: '',
      achievements: '',
      result: '',
      criteriaScores: [],
    },
  });

  // When template loads and no criteria scores yet, initialize them
  useEffect(() => {
    if (
      template?.criteria &&
      template.criteria.length > 0 &&
      form.values.criteriaScores.length === 0
    ) {
      form.setFieldValue('criteriaScores', buildCriteriaScores(template.criteria));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id]);

  // Calculate weighted total score from criteria
  const calculatedScore = useMemo(() => {
    if (!template?.criteria || form.values.criteriaScores.length === 0) {
      return form.values.score;
    }
    let total = 0;
    for (const c of template.criteria) {
      const entry = form.values.criteriaScores.find((s) => s.criteria_id === c.id);
      if (entry) {
        total += ((entry.score / c.max_score) * 100 * c.weight) / 100;
      }
    }
    return Math.round(total);
  }, [template, form.values.criteriaScores, form.values.score]);

  const handleSelectEmployee = (empId: string | null) => {
    setSelectedEmployee(empId);
    const existing = reviews.find((r: any) => r.employee_id === empId);
    if (existing) {
      form.setValues({
        score: existing.total_score ?? 70,
        comment: existing.comment ?? '',
        achievements: existing.achievements ?? '',
        result: existing.result ?? '',
        criteriaScores:
          existing.score_details && existing.score_details.length > 0
            ? existing.score_details.map((sd: any) => ({
                criteria_id: sd.criteria_id,
                score: sd.score,
                note: sd.note ?? '',
              }))
            : template?.criteria
              ? buildCriteriaScores(template.criteria)
              : [],
      });
    } else {
      form.setValues({
        score: 70,
        comment: '',
        achievements: '',
        result: '',
        criteriaScores: template?.criteria ? buildCriteriaScores(template.criteria) : [],
      });
    }
  };

  const buildPayload = (_submit: boolean) => {
    const hasCriteria = template?.criteria && template.criteria.length > 0;
    const totalScore = hasCriteria ? calculatedScore : form.values.score;

    return {
      cycle_id: selectedCycle!,
      employee_id: selectedEmployee!,
      reviewer_id: myEmployeeId!,
      total_score: Math.max(0, totalScore),
      comment: form.values.comment,
      achievements: form.values.achievements,
      result: form.values.result || undefined,
      score_details: hasCriteria
        ? form.values.criteriaScores.map((cs) => {
            const c = template!.criteria!.find((x) => x.id === cs.criteria_id);
            return {
              criteria_id: cs.criteria_id,
              criteria_name: c?.criterion ?? '',
              weight: c?.weight ?? 0,
              max_score: c?.max_score ?? 5,
              score: cs.score,
              note: cs.note,
            };
          })
        : undefined,
    };
  };

  const handleSave = async (submit = false) => {
    if (!selectedCycle || !selectedEmployee || !myEmployeeId) {
      notify.error('', {
        message: !myEmployeeId
          ? 'Your employee profile was not found'
          : 'Please select cycle and employee',
      });
      return;
    }

    if (
      submit &&
      (contractType === 'probation' || contractType === 'intern') &&
      !form.values.result
    ) {
      notify.error('', { message: 'Result is required for probation/intern reviews' });
      return;
    }

    const payload = buildPayload(submit);
    const nid = notify.loading(submit ? 'Submitting...' : 'Saving...');

    try {
      if (submit && existingReview) {
        // Update score details + submit in one call
        await submitReview.mutateAsync({ id: existingReview.id, ...payload });
      } else if (submit && !existingReview) {
        // Create then submit
        const created = await createReview.mutateAsync(payload);
        const reviewId = created?.data?.id;
        if (reviewId) {
          await submitReview.mutateAsync({ id: reviewId, ...payload });
        }
      } else {
        // Just save draft (upsert)
        await createReview.mutateAsync(payload);
      }
      notify.success(nid, { message: submit ? 'Review submitted' : 'Draft saved' });
    } catch (e: any) {
      notify.error(nid, { message: e?.response?.data?.message || 'An error occurred' });
    }
  };

  const cycleOptions = cycles.map((c: any) => ({ value: c.id, label: c.title }));
  const employeeOptions = employees
    .filter((e: any) => e.status === 'active')
    .map((e: any) => ({
      value: e.id,
      label: `${e.full_name} — ${e.position?.department?.department_name ?? ''}`,
    }));

  const scoreColor = calculatedScore >= 85 ? 'green' : calculatedScore >= 60 ? 'blue' : 'orange';

  const getGradeLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Average';
    return 'Below Average';
  };

  const probationResultOptions = Object.entries(PROBATION_RESULT_LABEL).map(([value, label]) => ({
    value,
    label,
  }));
  const internResultOptions = Object.entries(INTERN_RESULT_LABEL).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <Stack gap="lg">
      <PageHeader
        title="Performance Review"
        description="Evaluate employee performance based on defined criteria"
      />

      <Grid gutter="lg">
        {/* ── Main Form ── */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            {/* Cycle + Employee selectors */}
            <Card withBorder p="md">
              <Stack gap="md">
                <Select
                  label="Review Cycle"
                  placeholder="Select cycle..."
                  data={cycleOptions}
                  value={selectedCycle}
                  onChange={(val) => {
                    setSelectedCycle(val);
                    setSelectedEmployee(null);
                    form.reset();
                  }}
                  required
                  leftSection={<IconFileText size={16} />}
                />
                <Select
                  label="Employee"
                  placeholder="Select employee..."
                  data={employeeOptions}
                  value={selectedEmployee}
                  onChange={handleSelectEmployee}
                  searchable
                  disabled={!selectedCycle}
                  required
                />
                {existingReview && (
                  <Alert
                    icon={<IconInfoCircle size={16} />}
                    color={REVIEW_STATUS_COLOR[existingReview.status] ?? 'gray'}
                    variant="light"
                  >
                    Status: <strong>{REVIEW_STATUS_LABEL[existingReview.status]}</strong>
                    {isPublished && ' — Published, read-only'}
                  </Alert>
                )}
              </Stack>
            </Card>

            {/* Score summary */}
            {selectedEmployee && (
              <Card withBorder p="md">
                <Group justify="space-between" mb="md">
                  <Group>
                    <ThemeIcon size="lg" color={scoreColor} variant="light">
                      <IconChartBar size={20} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" c="dimmed">
                        Overall Score
                      </Text>
                      <Text size="xl" fw={700}>
                        {calculatedScore} / 100
                      </Text>
                    </div>
                  </Group>
                  <Badge size="lg" color={scoreColor} variant="filled">
                    {getGradeLabel(calculatedScore)}
                  </Badge>
                </Group>
                <Progress value={calculatedScore} color={scoreColor} size="lg" />
              </Card>
            )}

            {/* Criteria scoring */}
            {selectedEmployee && template?.criteria && template.criteria.length > 0 && (
              <Card withBorder p="md">
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Evaluation Criteria</Text>
                  <Badge variant="light">{template.title}</Badge>
                </Group>
                <Stack gap="md">
                  {template.criteria.map((criteria, idx) => {
                    const scoreIndex = form.values.criteriaScores.findIndex(
                      (s) => s.criteria_id === criteria.id,
                    );
                    const scoreEntry = form.values.criteriaScores[scoreIndex];

                    return (
                      <Paper key={criteria.id} p="md" withBorder>
                        <Stack gap="sm">
                          <Group justify="space-between">
                            <div style={{ flex: 1 }}>
                              <Text fw={500} size="sm">
                                {idx + 1}. {criteria.criterion}
                              </Text>
                              <Group gap="xs" mt={4}>
                                <Badge size="xs" variant="light" color="blue">
                                  Weight: {criteria.weight}%
                                </Badge>
                                <Badge size="xs" variant="light" color="gray">
                                  Max: {criteria.max_score}
                                </Badge>
                                <Badge size="xs" variant="light" color="cyan">
                                  {criteria.score_type === 'rating' ? 'Rating' : 'Binary'}
                                </Badge>
                              </Group>
                            </div>
                            <Badge size="lg" color="blue">
                              {scoreEntry?.score ?? 0} / {criteria.max_score}
                            </Badge>
                          </Group>

                          {scoreIndex >= 0 &&
                            (criteria.score_type === 'rating' ? (
                              <Slider
                                min={0}
                                max={criteria.max_score}
                                step={1}
                                marks={Array.from({ length: criteria.max_score + 1 }, (_, i) => ({
                                  value: i,
                                  label: String(i),
                                }))}
                                disabled={isPublished}
                                {...form.getInputProps(`criteriaScores.${scoreIndex}.score`)}
                              />
                            ) : (
                              <Group>
                                <Button
                                  variant={scoreEntry?.score === 0 ? 'filled' : 'light'}
                                  color="red"
                                  size="xs"
                                  disabled={isPublished}
                                  onClick={() =>
                                    form.setFieldValue(`criteriaScores.${scoreIndex}.score`, 0)
                                  }
                                >
                                  Not Met (0)
                                </Button>
                                <Button
                                  variant={
                                    scoreEntry?.score === criteria.max_score ? 'filled' : 'light'
                                  }
                                  color="green"
                                  size="xs"
                                  disabled={isPublished}
                                  onClick={() =>
                                    form.setFieldValue(
                                      `criteriaScores.${scoreIndex}.score`,
                                      criteria.max_score,
                                    )
                                  }
                                >
                                  Met ({criteria.max_score})
                                </Button>
                              </Group>
                            ))}

                          {scoreIndex >= 0 && (
                            <Textarea
                              placeholder="Optional note for this criterion..."
                              size="xs"
                              rows={2}
                              disabled={isPublished}
                              {...form.getInputProps(`criteriaScores.${scoreIndex}.note`)}
                            />
                          )}
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Card>
            )}

            {/* Simple score (no template) */}
            {selectedEmployee && !template?.criteria && (
              <Card withBorder p="md">
                <Text fw={600} mb="md">
                  Performance Score
                </Text>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      Overall Score
                    </Text>
                    <Badge size="lg" color={scoreColor} variant="light">
                      <Group gap={4}>
                        <IconStar size={14} fill="currentColor" />
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
                    disabled={isPublished}
                    {...form.getInputProps('score')}
                  />
                </Stack>
              </Card>
            )}

            {/* Feedback + Result */}
            {selectedEmployee && (
              <Card withBorder p="md">
                <Text fw={600} mb="md">
                  Feedback & Comments
                </Text>
                <Stack gap="md">
                  {/* Result field — only for probation / intern */}
                  {contractType === 'probation' && (
                    <Select
                      label="Probation Result"
                      placeholder="Select result..."
                      data={probationResultOptions}
                      required
                      disabled={isPublished}
                      {...form.getInputProps('result')}
                    />
                  )}
                  {contractType === 'intern' && (
                    <Select
                      label="Intern Result"
                      placeholder="Select result..."
                      data={internResultOptions}
                      required
                      disabled={isPublished}
                      {...form.getInputProps('result')}
                    />
                  )}

                  <Textarea
                    label="Key Achievements"
                    placeholder="Outstanding work, notable projects, contributions..."
                    rows={4}
                    disabled={isPublished}
                    {...form.getInputProps('achievements')}
                  />
                  <Textarea
                    label="General Feedback"
                    placeholder="Performance, attitude, areas for improvement..."
                    rows={4}
                    disabled={isPublished}
                    {...form.getInputProps('comment')}
                  />
                </Stack>
              </Card>
            )}

            {/* Actions */}
            {selectedEmployee && !isPublished && (
              <Group justify="flex-end">
                <Button
                  variant="light"
                  loading={createReview.isPending}
                  onClick={() => handleSave(false)}
                >
                  Save Draft
                </Button>
                <Button
                  leftSection={<IconCheck size={18} />}
                  loading={submitReview.isPending || createReview.isPending}
                  onClick={() => handleSave(true)}
                >
                  Submit Review
                </Button>
              </Group>
            )}
          </Stack>
        </Grid.Col>

        {/* ── Sidebar: reviews list ── */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder p="md" style={{ position: 'sticky', top: 20 }}>
            <Text fw={600} mb="md">
              Reviews in Cycle{selectedCycle && ` (${reviews.length})`}
            </Text>
            {!selectedCycle ? (
              <Center h={100}>
                <Text size="sm" c="dimmed" ta="center">
                  Select a cycle to see reviews
                </Text>
              </Center>
            ) : reviewsLoading ? (
              <Center h={100}>
                <Loader size="sm" />
              </Center>
            ) : reviews.length === 0 ? (
              <Center h={100}>
                <Text size="sm" c="dimmed" ta="center">
                  No reviews yet
                </Text>
              </Center>
            ) : (
              <Stack gap="xs" style={{ maxHeight: 600, overflowY: 'auto' }}>
                {reviews.map((r: any) => (
                  <Paper
                    key={r.id}
                    p="sm"
                    withBorder
                    style={{
                      cursor: 'pointer',
                      background:
                        r.employee_id === selectedEmployee
                          ? 'var(--mantine-color-blue-0)'
                          : 'transparent',
                      borderColor:
                        r.employee_id === selectedEmployee
                          ? 'var(--mantine-color-blue-3)'
                          : 'var(--mantine-color-gray-3)',
                    }}
                    onClick={() => handleSelectEmployee(r.employee_id)}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {r.employee?.full_name}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {r.employee?.position?.department?.department_name}
                        </Text>
                      </Stack>
                      <Stack gap={4} align="flex-end">
                        {r.total_score != null && (
                          <Badge size="xs" variant="light" color="blue">
                            {r.total_score}
                          </Badge>
                        )}
                        <Badge
                          size="xs"
                          color={
                            REVIEW_STATUS_COLOR[r.status as keyof typeof REVIEW_STATUS_COLOR] ??
                            'gray'
                          }
                          variant="dot"
                        >
                          {REVIEW_STATUS_LABEL[r.status as keyof typeof REVIEW_STATUS_LABEL] ??
                            r.status}
                        </Badge>
                      </Stack>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
