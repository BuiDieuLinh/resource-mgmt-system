import {
  TextInput,
  NumberInput,
  Select,
  Stack,
  SimpleGrid,
} from '@mantine/core';
import { useForm } from '@mantine/form';

export interface EmployeeFormValues { 
  name: string; 
  email: string; 
  role: string; 
  age: number; 
} 
interface Props { 
  mode: 'add' | 'edit'; 
  initialValues?: EmployeeFormValues; 
  onSubmit: (values: EmployeeFormValues) => void; 
}

export function EmployeeForm({ mode, initialValues, onSubmit }: Props) {
  const form = useForm<EmployeeFormValues>({
    initialValues: initialValues ?? {
      name: '',
      email: '',
      role: '',
      age: 0,
    },
    validate: {
      name: (v) => (!v ? 'Required' : null),
      email: (v) =>
        !v ? 'Required' : /^\S+@\S+$/.test(v) ? null : 'Invalid email',
      role: (v) => (!v ? 'Required' : null),
      age: (v) => (v <= 0 ? 'Age must be greater than 0' : null),
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <SimpleGrid cols={2} spacing="md">
          <TextInput
            label="Employee name"
            required
            placeholder="Enter name"
            {...form.getInputProps('name')}
          />

          <TextInput
            label="Email"
            required
            placeholder="Enter email"
            {...form.getInputProps('email')}
          />

          <Select
            label="Role"
            required
            placeholder="Select role"
            data={['Admin', 'Manager', 'User']}
            {...form.getInputProps('role')}
          />

          <NumberInput
            label="Age"
            required
            min={1}
            max={100}
            {...form.getInputProps('age')}
          />
        </SimpleGrid>
      </Stack>
    </form>
  );
}
