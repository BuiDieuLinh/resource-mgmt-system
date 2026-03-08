import {
  Modal,
  Button,
  Group,
  TextInput,
  Select,
  Grid,
  Avatar,
  FileButton,
  Text,
  Stack,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useState, useMemo, useEffect } from 'react';
import { IconUpload } from '@tabler/icons-react';
import { employeeValidationRules } from '../rule-form/employee-validation';
import type { EmployeeFormValues } from '../types';
import { useGetAllDepartments } from '../../departments/api/get-departments';
import { useGetAllPositions } from '../../positions/api/get-positions';

interface EmployeeFormModalProps {
  opened: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialValues?: Partial<EmployeeFormValues>;
  employeeId?: string;
  onSubmit: (values: EmployeeFormValues, id?: string) => void | Promise<void>;
  loading?: boolean;
}

export function EmployeeFormModal({
  opened,
  onClose,
  mode,
  initialValues,
  employeeId,
  onSubmit,
  loading = false,
}: EmployeeFormModalProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: departmentsData, isLoading: isDepartmentsLoading } = useGetAllDepartments();
  const { data: positionsData, isLoading: isPositionsLoading } = useGetAllPositions();

  const form = useForm<EmployeeFormValues>({
    initialValues: {
      employee_code: '',
      full_name: '',
      display_name: '',
      email: '',
      phone: '',
      identify_card: '',
      gender: '',
      date_of_birth: null,
      hire_date: new Date(),
      department_id: '',
      position_id: '',
      status: 'active',
      avatar: null,
    },
    validate: {
      employee_code: employeeValidationRules.employee_code,
      full_name: employeeValidationRules.full_name,
      display_name: employeeValidationRules.display_name,
      email: employeeValidationRules.email,
      phone: employeeValidationRules.phone,
      identify_card: employeeValidationRules.identify_card,
      gender: employeeValidationRules.gender,
      date_of_birth: employeeValidationRules.date_of_birth,
      hire_date: employeeValidationRules.hire_date,
      department_id: employeeValidationRules.department_id,
      position_id: employeeValidationRules.position_id,
      status: employeeValidationRules.status,
    },
  });

  useEffect(() => {
    if (opened && initialValues) {
      form.setValues({
        employee_code: initialValues.employee_code || '',
        full_name: initialValues.full_name || '',
        display_name: initialValues.display_name || '',
        email: initialValues.email || '',
        phone: initialValues.phone || '',
        identify_card: initialValues.identify_card || '',
        gender: initialValues.gender || '',
        date_of_birth: initialValues.date_of_birth || null,
        hire_date: initialValues.hire_date || new Date(),
        department_id: initialValues.department_id || '',
        position_id: initialValues.position_id || '',
        status: initialValues.status || 'active',
        avatar: null,
      });

      if (initialValues.avatar) {
        setAvatarPreview(initialValues.avatar as any);
      }
    }
  }, [opened, initialValues]);

  const handleAvatarChange = (file: File | null) => {
    form.setFieldValue('avatar', file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  const handleSubmit = async (values: EmployeeFormValues) => {
    await onSubmit(values, employeeId);
    form.reset();
    setAvatarPreview(null);
  };

  const handleClose = () => {
    form.reset();
    setAvatarPreview(null);
    onClose();
  };

  const departmentOptions = useMemo(() => {
    if (!departmentsData?.data) return [];
    return departmentsData.data.map((dept) => ({
      value: dept.id,
      label: dept.department_name,
    }));
  }, [departmentsData]);

  const positionOptions = useMemo(() => {
    if (!positionsData?.data) return [];
    return positionsData.data.map((pos) => ({
      value: pos.id,
      label: pos.position_name,
    }));
  }, [positionsData]);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text size="xl" fw={700} c="deepPurple">
          {mode === 'edit' ? 'EDIT EMPLOYEE' : 'ADD EMPLOYEE'}
        </Text>
      }
      size="xl"
      centered
      styles={{
        header: {
          borderBottom: '2px solid #e9ecef',
          padding: '5px 15px',
        },
        body: {
          paddingTop: '10px',
        },
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        {/* avatar centered above the form */}
        {/* <Group  mb="md">
          <Stack align="center">
            <Avatar src={avatarPreview} size={80} radius="xl" />
            <FileButton onChange={handleAvatarChange} accept="image/png,image/jpeg,image/jpg">
              {(props) => (
                <Button {...props} variant="light" size="xs" leftSection={<IconUpload size={14} />}>
                  Upload Avatar
                </Button>
              )}
            </FileButton>
            <Text size="xs" c="dimmed">
              PNG, JPG up to 5MB
            </Text>
          </Stack>
        </Group> */}

        <Stack gap="sm">
          {/* row 1: code, full name, display name */}
          <Grid gutter="sm">
            <Grid.Col span={4}>
              <TextInput
                label="Employee Code"
                placeholder="e.g., EMP-001"
                required
                disabled={mode === 'edit'}
                {...form.getInputProps('employee_code')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Full Name"
                placeholder="Enter full name"
                required
                {...form.getInputProps('full_name')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Display Name"
                placeholder="Enter display name (optional)"
                {...form.getInputProps('display_name')}
              />
            </Grid.Col>
          </Grid>

          {/* row 2: email, phone, id card */}
          <Grid gutter="sm">
            <Grid.Col span={4}>
              <TextInput
                label="Email"
                placeholder="example@company.com"
                type="email"
                required
                {...form.getInputProps('email')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Phone Number"
                placeholder="+84 123 456 789"
                {...form.getInputProps('phone')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Identity Card"
                placeholder="Enter ID card number"
                required
                {...form.getInputProps('identify_card')}
              />
            </Grid.Col>
          </Grid>

          {/* row 3: department, position, hire date */}
          <Grid gutter="sm">
            <Grid.Col span={4}>
              <Select
                label="Department"
                placeholder="Select department"
                required
                data={departmentOptions}
                searchable
                disabled={isDepartmentsLoading}
                {...form.getInputProps('department_id')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                label="Position"
                placeholder="Select position"
                required
                data={positionOptions}
                searchable
                disabled={isPositionsLoading}
                {...form.getInputProps('position_id')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <DateInput
                label="Hire Date"
                placeholder="Select hire date"
                valueFormat="DD/MM/YYYY"
                required
                maxDate={new Date()}
                {...form.getInputProps('hire_date')}
              />
            </Grid.Col>
          </Grid>

          {/* row 4: status, gender, date of birth */}
          <Grid gutter="sm">
            <Grid.Col span={4}>
              <Select
                label="Status"
                placeholder="Select status"
                required
                data={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                {...form.getInputProps('status')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                label="Gender"
                placeholder="Select gender"
                data={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
                clearable
                {...form.getInputProps('gender')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <DateInput
                label="Date of Birth"
                placeholder="Select date of birth"
                valueFormat="DD/MM/YYYY"
                clearable
                maxDate={new Date()}
                {...form.getInputProps('date_of_birth')}
              />
            </Grid.Col>
          </Grid>
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {mode === 'edit' ? 'Update' : 'Create'}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
