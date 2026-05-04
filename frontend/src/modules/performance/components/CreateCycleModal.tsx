import { useState, useMemo } from 'react';
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

const SCORE_TYPE_OPTIONS = [
  { value: 'rating', label: 'Rating' },
  { value: 'binary', label: 'Binary' },
];

const PERIOD_LABEL: Record<string, string> = { monthly: 'Monthly', quarterly: 'Quarterly' };

interface CreateCycleModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: any) => Promise<void>;
  templates: IEvaluationTemplate[];
  employees: any[];
  isLoading: boolean;
}

export function CreateCycleModal({
  opened,
  onClose,
  onSubmit,
  templates,
  employees,
  isLoading,
}: CreateCycleModalProps) {
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
      title: (v) => (!v ? 'Required' : null),
      announce_date: (v) => (!v ? 'Required' : null),
    },
  });

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
            reviewer_id: e.manager_id || '',
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
      const deptName = emp.position?.department?.department_name || 'No Department';
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
        reviewer_id: employee?.manager_id || '',
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
      assignments: form.values.assignments,
      custom_criteria: form.values.customCriteria ? form.values.criteria : undefined,
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
    <Modal opened={opened} onClose={handleClose} title="Create Review Cycle" size="xl" centered>
      <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false}>
        {/* Step 1: Basic Info */}
        <Stepper.Step label="Basic Info" description="Cycle details">
          <Stack gap="md" mt="md">
            <TextInput
              label="Cycle Name"
              placeholder="e.g. Q1 2026 Performance Review"
              required
              {...form.getInputProps('title')}
            />
            <Select
              label="Period Type"
              data={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
              ]}
              {...form.getInputProps('period_type')}
            />
            <Group grow>
              <NumberInput
                label="Year"
                min={2020}
                max={2100}
                {...form.getInputProps('period_year')}
              />
              <NumberInput
                label={form.values.period_type === 'monthly' ? 'Month (1-12)' : 'Quarter (1-4)'}
                min={1}
                max={form.values.period_type === 'monthly' ? 12 : 4}
                {...form.getInputProps('period_seq')}
              />
            </Group>
            <DateInput
              label="Announce Date"
              placeholder="Pick announcement date"
              required
              minDate={new Date()}
              description="Date when results will be published to employees"
              {...form.getInputProps('announce_date')}
            />
            <Select
              label="Evaluation Template"
              placeholder="Select template (optional)"
              data={templateOptions}
              clearable
              searchable
              description="Choose a template to define evaluation criteria"
              value={form.values.template_id}
              onChange={handleTemplateChange}
            />

            {form.values.template_id && form.values.criteria.length > 0 && (
              <Checkbox
                label="Customize criteria for this cycle"
                description="Modify the template criteria specifically for this cycle"
                {...form.getInputProps('customCriteria', { type: 'checkbox' })}
              />
            )}

            {form.values.customCriteria && form.values.criteria.length > 0 && (
              <>
                <Divider label="Customize Criteria" labelPosition="center" />
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    Total Weight:
                  </Text>
                  <Badge size="lg" color={isWeightValid ? 'green' : 'red'}>
                    {totalWeight}%
                  </Badge>
                </Group>

                {!isWeightValid && (
                  <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                    Total weight must equal 100%. Current: {totalWeight}%
                  </Alert>
                )}

                <Stack gap={6}>
                  {form.values.criteria.map((_, index) => (
                    <Group key={index} align="center" gap={6} wrap="nowrap">
                      <TextInput
                        placeholder="Criterion name"
                        required
                        size="xs"
                        style={{ flex: 1, minWidth: 0 }}
                        styles={{ input: { height: 32 } }}
                        {...form.getInputProps(`criteria.${index}.criterion`)}
                      />
                      <NumberInput
                        placeholder="Weight %"
                        min={1}
                        max={100}
                        required
                        size="xs"
                        style={{ width: 85 }}
                        styles={{ input: { height: 32 } }}
                        {...form.getInputProps(`criteria.${index}.weight`)}
                      />
                      <NumberInput
                        placeholder="Max"
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
                  Add Criterion
                </Button>
              </>
            )}
          </Stack>
        </Stepper.Step>

        {/* Step 2: Assignments */}
        <Stepper.Step label="Assignments" description="Assign reviewers">
          <Stack gap="md" mt="md">
            {form.values.template_id ? (
              <>
                <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                  {filteredEmployeesForAssignment.length > 0 ? (
                    <>
                      Found{' '}
                      <strong>{filteredEmployeesForAssignment.length} active employees</strong>{' '}
                      matching template criteria. Select employees and assign reviewers.
                    </>
                  ) : (
                    'No active employees match the template criteria.'
                  )}
                </Alert>

                {filteredEmployeesForAssignment.length > 0 && (
                  <>
                    <Group justify="space-between">
                      <Text size="sm" fw={500}>
                        Selected: {form.values.assignments.length} /{' '}
                        {filteredEmployeesForAssignment.length}
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
                          Select All
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          color="red"
                          onClick={() => {
                            form.setFieldValue('assignments', []);
                          }}
                        >
                          Clear All
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
                                      {selectedInDept} / {deptEmployees.length} selected
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
                                      <Table.Th>Employee</Table.Th>
                                      <Table.Th>Contract</Table.Th>
                                      <Table.Th>Reviewer</Table.Th>
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
                                                placeholder="Select reviewer"
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
                  No template selected. You can manually add employee-reviewer assignments or skip
                  this step.
                </Alert>

                {form.values.assignments.map((_, index) => (
                  <Paper key={index} p="sm" withBorder>
                    <Group align="flex-start" wrap="nowrap">
                      <Select
                        label="Employee"
                        placeholder="Select employee"
                        data={employeeOptions}
                        searchable
                        style={{ flex: 1 }}
                        {...form.getInputProps(`assignments.${index}.employee_id`)}
                      />
                      <Select
                        label="Reviewer"
                        placeholder="Select reviewer"
                        data={employeeOptions}
                        searchable
                        style={{ flex: 1 }}
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
                  Add Assignment
                </Button>
              </>
            )}
          </Stack>
        </Stepper.Step>

        {/* Step 3: Review */}
        <Stepper.Step label="Review" description="Confirm details">
          <Stack gap="md" mt="md">
            <Paper p="md" withBorder>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Cycle Name
                  </Text>
                  <Text fw={500}>{form.values.title}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Period
                  </Text>
                  <Text>
                    {PERIOD_LABEL[form.values.period_type]} - {form.values.period_year} Q
                    {form.values.period_seq}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Announce Date
                  </Text>
                  <Text>
                    {form.values.announce_date
                      ? new Date(form.values.announce_date).toLocaleDateString('en-GB')
                      : 'N/A'}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Template
                  </Text>
                  <Text>
                    {form.values.template_id
                      ? templates.find((t) => t.id === form.values.template_id)?.title
                      : 'No template'}
                  </Text>
                </Group>
                {form.values.customCriteria && (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Custom Criteria
                    </Text>
                    <Badge color="orange">{form.values.criteria.length} criteria</Badge>
                  </Group>
                )}
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Assignments
                  </Text>
                  <Badge>{form.values.assignments.length} assignments</Badge>
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
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        {activeStep < 2 ? (
          <Button onClick={handleNextStep}>Next Step</Button>
        ) : (
          <Button
            onClick={handleSubmitForm}
            loading={isLoading}
            disabled={form.values.customCriteria && !isWeightValid}
          >
            Create Cycle
          </Button>
        )}
      </Group>
    </Modal>
  );
}
