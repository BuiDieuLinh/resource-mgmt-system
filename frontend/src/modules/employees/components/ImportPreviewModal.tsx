import { Modal, Stack, Group, Button, Text, Badge, ScrollArea, Table } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import type { PreviewEmployee } from '../api/preview-import';

interface ImportPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  data: PreviewEmployee[];
  onConfirm: () => void;
  loading?: boolean;
}

export function ImportPreviewModal({
  opened,
  onClose,
  data,
  onConfirm,
  loading = false,
}: ImportPreviewModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Text fw={700} size="lg" c="deepPurple">
            Import Preview
          </Text>
          <Badge size="lg" variant="light" color="deepPurple">
            {data.length} employees
          </Badge>
        </Group>
      }
      size="xl"
      styles={{
        title: {
          width: '100%',
        },
        header: {
          borderBottom: '1px solid #e9ecef',
          paddingBottom: '12px',
        },
      }}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Review the data below before importing. Make sure all information is correct.
        </Text>

        <ScrollArea h={400}>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Code</Table.Th>
                <Table.Th>Full Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Phone</Table.Th>
                <Table.Th>Department</Table.Th>
                <Table.Th>Position</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((emp, index) => (
                <Table.Tr key={index}>
                  <Table.Td>{emp.employee_code}</Table.Td>
                  <Table.Td>{emp.full_name}</Table.Td>
                  <Table.Td>{emp.email}</Table.Td>
                  <Table.Td>{emp.phone || '-'}</Table.Td>
                  <Table.Td>{emp.department_name}</Table.Td>
                  <Table.Td>{emp.position_name}</Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      color={emp.status === 'active' ? 'green' : 'gray'}
                      variant="light"
                    >
                      {emp.status}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        <Group justify="flex-end" gap="sm">
          <Button
            variant="subtle"
            color="gray"
            onClick={onClose}
            leftSection={<IconX size={16} />}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} loading={loading} leftSection={<IconCheck size={16} />}>
            Confirm Import
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
