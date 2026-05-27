import { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  Stack,
  Group,
  Button,
  TextInput,
  Select,
  NumberInput,
  Stepper,
  Alert,
  Checkbox,
  Divider,
  Badge,
  ActionIcon,
  Paper,
  Text,
  Collapse,
  Table,
  ScrollArea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import {
  IconPlus,
  IconTrash,
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import type { CycleFormValues, IEvaluationTemplate } from '../types';
import { useTranslation } from 'react-i18next';

const SCORE_TYPE_OPTIONS = [
  { value: 'rating', label: 'Rating' },
  { value: 'binary', label: 'Binary' },
];

interface CreateCycleModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: any) => Promise<void>;
  templates: IEvaluationTemplate[];
  employees: any[];
  isLoading: boolean;
  mode?: 'create' | 'update';
  initialValues?: any | null;
}

export function CreateCycleModal({
  opened,
  onClose,
  onSubmit,
  templates,
  employees,
  isLoading,
  mode = 'create',
  initialValues = null,
}: CreateCycleModalProps) {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const form = useForm<
    CycleFormValues & {
      assignments: Array<{ employee_id: string; reviewer_id: string }>;
      customCriteria: boolean;
      criteria: Array<{
        criterion: string;
        weight: number;
        max_score: number;
        score_type: 'rating' | 'binary';
      }>;
    }
  >({
    initialValues: {
      title: '',
      period_type: 'monthly' as 'monthly' | 'quarterly',
      period_year: new Date().getFullYear(),
      period_seq: new Date().getMonth() + 1,
      announce_date: null as Date | null,
      template_id: undefined,
      assignments: [],
      customCriteria: false,
      criteria: [],
    },
    validate: {
      title: (v) => (!v ? t('common.required') : null),
      announce_date: (v) => (!v ? t('common.required') : null),
    },
  });

  useEffect(() => {
    if (!opened) return;

    if (!initialValues) {
      form.reset();
      setActiveStep(0);
      return;
    }

    form.setValues({
      title: initialValues.title ?? '',
      period_type: initialValues.period_type ?? 'monthly',
      period_year: initialValues.period_year ?? new Date().getFullYear(),
      period_seq: initialValues.period_seq ?? new Date().getMonth() + 1,
      announce_date: initialValues.announce_date ? new Date(initialValues.announce_date) : null,
      template_id: initialValues.template_id ?? undefined,
      assignments:
        initialValues.assignments?.map((assignment: any) => ({
          employee_id: assignment.employee_id,
          reviewer_id: assignment.reviewer_id ?? '',
        })) ?? [],
      customCriteria: false,
      criteria:
        initialValues.template?.criteria?.map((c: any) => ({
          criterion: c.criterion,
          weight: c.weight,
          max_score: c.max_score,
          score_type: c.score_type,
        })) ?? [],
    });
    setActiveStep(0);
  }, [opened, initialValues]);

  const handleTemplateChange = (templateId: string | null) => {
    form.setFieldValue('template_id', templateId ?? undefined);
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template?.criteria) {
        form.setFieldValue(
          'criteria',
          template.criteria.map((c) => ({
            criterion: c.criterion,
            weight: c.weight,
            max_score: c.max_score,
            score_type: c.score_type,
          })),
        );
      }

      if (template?.apply_to && template.apply_to.length > 0) {
        const filteredEmployees = employees.filter(
          (e) => e.status === 'active' && template.apply_to!.includes(e.contract_type),
        );
        form.setFieldValue(
          'assignments',
          filteredEmployees.map((e) => ({
            employee_id: e.id,
            reviewer_id: e.manager_id || undefined,
          })),
        );
      } else {
        form.setFieldValue('assignments', []);
      }
    } else {
      form.setFieldValue('criteria', []);
      form.setFieldValue('customCriteria', false);
      form.setFieldValue('assignments', []);
    }
  };

  const filteredEmployeesForAssignment = useMemo(() => {
    const activeEmployees = employees.filter((e) => e.status === 'active');
    if (!form.values.template_id) return activeEmployees;

    const template = templates.find((t) => t.id === form.values.template_id);
    if (!template?.apply_to || template.apply_to.length === 0) return activeEmployees;

    return activeEmployees.filter((e) => template.apply_to!.includes(e.contract_type));
  }, [form.values.template_id, templates, employees]);

  const groupedEmployees = useMemo(() => {
    const groups: Record<string, typeof filteredEmployeesForAssignment> = {};
    filteredEmployeesForAssignment.forEach((emp) => {
      const deptName = emp.position?.department?.department_name || t('employee.noDepartment');
      if (!groups[deptName]) groups[deptName] = [];
      groups[deptName].push(emp);
    });
    return groups;
  }, [filteredEmployeesForAssignment]);

  const selectedEmployeeIds = useMemo(
    () => new Set(form.values.assignments.map((a) => a.employee_id)),
    [form.values.assignments],
  );

  const toggleEmployee = (employeeId: string, isSelected: boolean) => {
    if (isSelected) {
      const employee = employees.find((e) => e.id === employeeId);
      form.insertListItem('assignments', {
        employee_id: employeeId,
        reviewer_id: employee?.manager_id || undefined,
      });
    } else {
      const index = form.values.assignments.findIndex((a) => a.employee_id === employeeId);
      if (index !== -1) {
        form.removeListItem('assignments', index);
      }
    }
  };

  const toggleDepartment = (
    deptEmployees: typeof filteredEmployeesForAssignment,
    select: boolean,
  ) => {
    deptEmployees.forEach((emp) => {
      const isCurrentlySelected = selectedEmployeeIds.has(emp.id);
      if (select && !isCurrentlySelected) {
        toggleEmployee(emp.id, true);
      } else if (!select && isCurrentlySelected) {
        toggleEmployee(emp.id, false);
      }
    });
  };

  const handleNextStep = () => {
    if (activeStep === 0) {
      if (!form.values.title || !form.values.announce_date) {
        return;
      }
    }
    setActiveStep((current) => (current < 2 ? current + 1 : current));
  };

  const handleSubmitForm = async () => {
    const totalWeight = form.values.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (form.values.customCriteria && form.values.criteria.length > 0 && totalWeight !== 100) {
      return;
    }

    await onSubmit({
      title: form.values.title,
      period_type: form.values.period_type,
      period_year: form.values.period_year,
      period_seq: form.values.period_seq,
      template_id: form.values.template_id,
      announce_date:
        form.values.announce_date instanceof Date
          ? form.values.announce_date.toISOString().slice(0, 10)
          : new Date(form.values.announce_date!).toISOString().slice(0, 10),
      assignments: form.values.assignments
        .filter((a) => a.employee_id)
        .map((a) => ({
          employee_id: a.employee_id,
          ...(a.reviewer_id ? { reviewer_id: a.reviewer_id } : {}),
        })),
    });

    setActiveStep(0);
    form.reset();
  };

  const handleClose = () => {
    setActiveStep(0);
    form.reset();
    onClose();
  };

  const activeTemplates = templates.filter((t) => t.is_active);
  const templateOptions = activeTemplates.map((t) => ({
    value: t.id,
    label: t.title,
  }));

  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: `${e.full_name} (${e.employee_code})`,
  }));

  const totalWeight = form.values.criteria.reduce((sum, c) => sum + c.weight, 0);
  const isWeightValid = totalWeight === 100;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        mode === 'create' ? t('performance.createCycleTitle') : t('performance.updateCycleTitle')
      }
      size="xl"
      centered
    >
      <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false}>
        {/* Step 1: Basic Info */}
        <Stepper.Step
          label={t('performance.basicInfo')}
          description={t('performance.cycleDetails')}
        >
          <Stack gap="md" mt="md">
            <TextInput
              label={t('performance.cycleName')}
              placeholder={t('performance.cycleNamePlaceholder')}
              required
              {...form.getInputProps('title')}
            />
            <Select
              label={t('performance.periodType')}
              data={[
                { value: 'monthly', label: t('performance.periodMonthly') },
                { value: 'quarterly', label: t('performance.periodQuarterly') },
              ]}
              checkIconPosition="right"
              {...form.getInputProps('period_type')}
            />
            <Group grow>
              <NumberInput
                label={t('common.year')}
                min={2020}
                max={2100}
                {...form.getInputProps('period_year')}
              />
              <NumberInput
                label={
                  form.values.period_type === 'monthly'
                    ? t('performance.monthRange')
                    : t('performance.quarterRange')
                }
                min={1}
                max={form.values.period_type === 'monthly' ? 12 : 4}
                {...form.getInputProps('period_seq')}
              />
            </Group>
            <DateInput
              label={t('performance.announceDate')}
              placeholder={t('performance.pickAnnouncementDate')}
              required
              description={t('performance.announceDateDescription')}
              {...form.getInputProps('announce_date')}
            />
            <Select
              label={t('performance.evaluationTemplate')}
              placeholder={t('performance.selectTemplateOptional')}
              data={templateOptions}
              clearable
              searchable
              description={t('performance.selectTemplateDescription')}
              checkIconPosition="right"
              value={form.values.template_id}
              onChange={handleTemplateChange}
            />

            {form.values.template_id && form.values.criteria.length > 0 && (
              <Checkbox
                label={t('performance.customizeCriteria')}
                description={t('performance.customizeCriteriaDescription')}
                {...form.getInputProps('customCriteria', { type: 'checkbox' })}
              />
            )}

            {form.values.customCriteria && form.values.criteria.length > 0 && (
              <>
                <Divider label={t('performance.customizeCriteria')} labelPosition="center" />
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    {t('performance.totalWeight')}:
                  </Text>
                  <Badge size="lg" color={isWeightValid ? 'green' : 'red'}>
                    {totalWeight}%
                  </Badge>
                </Group>

                {!isWeightValid && (
                  <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                    {t('performance.totalWeightInvalid', { total: totalWeight })}
                  </Alert>
                )}

                <Stack gap={6}>
                  {form.values.criteria.map((_, index) => (
                    <Group key={index} align="center" gap={6} wrap="nowrap">
                      <TextInput
                        placeholder={t('performance.criterionNamePlaceholder')}
                        required
                        size="xs"
                        style={{ flex: 1, minWidth: 0 }}
                        styles={{ input: { height: 32 } }}
                        {...form.getInputProps(`criteria.${index}.criterion`)}
                      />
                      <NumberInput
                        placeholder={t('performance.weightPlaceholder')}
                        min={1}
                        max={100}
                        required
                        size="xs"
                        style={{ width: 85 }}
                        styles={{ input: { height: 32 } }}
                        {...form.getInputProps(`criteria.${index}.weight`)}
                      />
                      <NumberInput
                        placeholder={t('performance.maxPlaceholder')}
                        min={1}
                        max={10}
                        required
                        size="xs"
                        style={{ width: 65 }}
                        styles={{ input: { height: 32 } }}
                        {...form.getInputProps(`criteria.${index}.max_score`)}
                      />
                      <Select
                        data={SCORE_TYPE_OPTIONS}
                        required
                        size="xs"
                        style={{ width: 95 }}
                        styles={{ input: { height: 32 } }}
                        checkIconPosition="right"
                        {...form.getInputProps(`criteria.${index}.score_type`)}
                      />
                      {form.values.criteria.length > 1 && (
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          size="xs"
                          style={{ minWidth: 28, height: 28 }}
                          onClick={() => {
                            const newCriteria = [...form.values.criteria];
                            newCriteria.splice(index, 1);
                            form.setFieldValue('criteria', newCriteria);
                          }}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      )}
                    </Group>
                  ))}
                </Stack>

                <Button
                  variant="light"
                  size="xs"
                  leftSection={<IconPlus size={12} />}
                  onClick={() => {
                    form.insertListItem('criteria', {
                      criterion: '',
                      weight: 10,
                      max_score: 5,
                      score_type: 'rating',
                    });
                  }}
                >
                  {t('performance.addCriterion')}
                </Button>
              </>
            )}
          </Stack>
        </Stepper.Step>

        {/* Step 2: Assignments */}
        <Stepper.Step
          label={t('performance.assignments')}
          description={t('performance.assignReviewers')}
        >
          <Stack gap="md" mt="md">
            {form.values.template_id ? (
              <>
                <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                  {filteredEmployeesForAssignment.length > 0 ? (
                    <>
                      {t('performance.foundActiveEmployeesPrefix')}{' '}
                      <strong>
                        {t('performance.activeEmployeesCount', {
                          count: filteredEmployeesForAssignment.length,
                        })}
                      </strong>{' '}
                      {t('performance.foundActiveEmployeesSuffix')}
                    </>
                  ) : (
                    t('performance.noMatchingActiveEmployees')
                  )}
                </Alert>

                {filteredEmployeesForAssignment.length > 0 && (
                  <>
                    <Group justify="space-between">
                      <Text size="sm" fw={500}>
                        {t('performance.selectedAssignments', {
                          selected: form.values.assignments.length,
                          total: filteredEmployeesForAssignment.length,
                        })}
                      </Text>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => {
                            filteredEmployeesForAssignment.forEach((emp) => {
                              if (!selectedEmployeeIds.has(emp.id)) {
                                toggleEmployee(emp.id, true);
                              }
                            });
                          }}
                        >
                          {t('actions.selectAll')}
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          color="red"
                          onClick={() => {
                            form.setFieldValue('assignments', []);
                          }}
                        >
                          {t('performance.clearAll')}
                        </Button>
                      </Group>
                    </Group>

                    <ScrollArea h={400}>
                      <Stack gap="xs">
                        {Object.entries(groupedEmployees).map(([deptName, deptEmployees]) => {
                          const isExpanded = expandedDepts.has(deptName);
                          const selectedInDept = deptEmployees.filter((e) =>
                            selectedEmployeeIds.has(e.id),
                          ).length;
                          const allSelected = selectedInDept === deptEmployees.length;

                          return (
                            <Paper key={deptName} withBorder>
                              <Group
                                p="sm"
                                justify="space-between"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  setExpandedDepts((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(deptName)) next.delete(deptName);
                                    else next.add(deptName);
                                    return next;
                                  });
                                }}
                              >
                                <Group>
                                  <ActionIcon variant="subtle" size="sm">
                                    {isExpanded ? (
                                      <IconChevronUp size={16} />
                                    ) : (
                                      <IconChevronDown size={16} />
                                    )}
                                  </ActionIcon>
                                  <div>
                                    <Text fw={500} size="sm">
                                      {deptName}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                      {t('performance.selectedAssignments', {
                                        selected: selectedInDept,
                                        total: deptEmployees.length,
                                      })}
                                    </Text>
                                  </div>
                                </Group>
                                <Checkbox
                                  checked={allSelected}
                                  indeterminate={selectedInDept > 0 && !allSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleDepartment(deptEmployees, !allSelected);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </Group>

                              <Collapse in={isExpanded}>
                                <Table
                                  striped
                                  highlightOnHover
                                  withTableBorder={false}
                                  withColumnBorders={false}
                                >
                                  <Table.Thead>
                                    <Table.Tr>
                                      <Table.Th style={{ width: 40 }}></Table.Th>
                                      <Table.Th>{t('employee.employee')}</Table.Th>
                                      <Table.Th>{t('employee.contractType')}</Table.Th>
                                      <Table.Th>{t('performance.reviewer')}</Table.Th>
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    {deptEmployees.map((emp) => {
                                      const isSelected = selectedEmployeeIds.has(emp.id);
                                      const assignmentIndex = form.values.assignments.findIndex(
                                        (a) => a.employee_id === emp.id,
                                      );

                                      return (
                                        <Table.Tr key={emp.id}>
                                          <Table.Td>
                                            <Checkbox
                                              checked={isSelected}
                                              onChange={(e) =>
                                                toggleEmployee(emp.id, e.currentTarget.checked)
                                              }
                                            />
                                          </Table.Td>
                                          <Table.Td>
                                            <div>
                                              <Text size="sm" fw={500}>
                                                {emp.full_name}
                                              </Text>
                                              <Text size="xs" c="dimmed">
                                                {emp.employee_code}
                                              </Text>
                                            </div>
                                          </Table.Td>
                                          <Table.Td>
                                            <Badge size="sm" variant="light">
                                              {emp.contract_type}
                                            </Badge>
                                          </Table.Td>
                                          <Table.Td>
                                            {isSelected && assignmentIndex !== -1 ? (
                                              <Select
                                                placeholder={t('performance.selectReviewer')}
                                                data={employeeOptions}
                                                searchable
                                                size="xs"
                                                {...form.getInputProps(
                                                  `assignments.${assignmentIndex}.reviewer_id`,
                                                )}
                                              />
                                            ) : (
                                              <Text size="xs" c="dimmed">
                                                —
                                              </Text>
                                            )}
                                          </Table.Td>
                                        </Table.Tr>
                                      );
                                    })}
                                  </Table.Tbody>
                                </Table>
                              </Collapse>
                            </Paper>
                          );
                        })}
                      </Stack>
                    </ScrollArea>
                  </>
                )}
              </>
            ) : (
              <>
                <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                  {t('performance.noTemplateSelectedAssignments')}
                </Alert>

                {form.values.assignments.map((_, index) => (
                  <Paper key={index} p="sm" withBorder>
                    <Group align="flex-start" wrap="nowrap">
                      <Select
                        label={t('employee.employee')}
                        placeholder={t('performance.selectEmployee')}
                        data={employeeOptions}
                        searchable
                        style={{ flex: 1 }}
                        {...form.getInputProps(`assignments.${index}.employee_id`)}
                      />
                      <Select
                        label={t('performance.reviewer')}
                        placeholder={t('performance.selectReviewer')}
                        data={employeeOptions}
                        searchable
                        style={{ flex: 1 }}
                        checkIconPosition="right"
                        {...form.getInputProps(`assignments.${index}.reviewer_id`)}
                      />
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        mt={28}
                        onClick={() => {
                          const newAssignments = [...form.values.assignments];
                          newAssignments.splice(index, 1);
                          form.setFieldValue('assignments', newAssignments);
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                ))}

                <Button
                  variant="light"
                  leftSection={<IconPlus size={16} />}
                  onClick={() => {
                    form.insertListItem('assignments', { employee_id: '', reviewer_id: '' });
                  }}
                >
                  {t('performance.addAssignment')}
                </Button>
              </>
            )}
          </Stack>
        </Stepper.Step>

        {/* Step 3: Review */}
        <Stepper.Step
          label={t('leaveRequest.review')}
          description={t('performance.confirmDetails')}
        >
          <Stack gap="md" mt="md">
            <Paper p="md" withBorder>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {t('performance.cycleName')}
                  </Text>
                  <Text fw={500}>{form.values.title}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {t('common.period')}
                  </Text>
                  <Text>
                    {form.values.period_type === 'monthly'
                      ? t('performance.periodMonthly')
                      : t('performance.periodQuarterly')}{' '}
                    - {form.values.period_year} {form.values.period_type === 'monthly' ? 'M' : 'Q'}
                    {form.values.period_seq}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {t('performance.announceDate')}
                  </Text>
                  <Text>
                    {form.values.announce_date
                      ? new Date(form.values.announce_date).toLocaleDateString('en-GB')
                      : t('common.notAvailable')}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {t('common.template')}
                  </Text>
                  <Text>
                    {form.values.template_id
                      ? templates.find((t) => t.id === form.values.template_id)?.title
                      : t('performance.noTemplate')}
                  </Text>
                </Group>
                {form.values.customCriteria && (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      {t('performance.customCriteria')}
                    </Text>
                    <Badge color="orange">
                      {t('performance.criteriaCount', { count: form.values.criteria.length })}
                    </Badge>
                  </Group>
                )}
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {t('performance.assignments')}
                  </Text>
                  <Badge>
                    {t('performance.assignmentsCount', { count: form.values.assignments.length })}
                  </Badge>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        </Stepper.Step>
      </Stepper>

      <Group justify="space-between" mt="xl">
        <Button
          variant="subtle"
          onClick={() => {
            if (activeStep === 0) {
              handleClose();
            } else {
              setActiveStep((current) => current - 1);
            }
          }}
        >
          {activeStep === 0 ? t('common.cancel') : t('actions.back')}
        </Button>
        {activeStep < 2 ? (
          <Button onClick={handleNextStep}>{t('performance.nextStep')}</Button>
        ) : (
          <Button
            onClick={handleSubmitForm}
            loading={isLoading}
            disabled={form.values.customCriteria && !isWeightValid}
          >
            {mode === 'create' ? t('performance.createCycle') : t('performance.updateCycle')}
          </Button>
        )}
      </Group>
    </Modal>
  );
}
