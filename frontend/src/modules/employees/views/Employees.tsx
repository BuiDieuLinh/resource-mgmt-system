import { saveAs } from 'file-saver';
import {
  Stack,
  Group,
  TextInput,
  Select,
  Button,
  ActionIcon,
  Badge,
  Menu,
  FileButton,
} from '@mantine/core';
import {
  IconEdit,
  IconSearch,
  IconEye,
  IconSitemap,
  IconFileExport,
  IconFileImport,
  IconDotsVertical,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BaseTable, type TableColumn } from '../../../components/BaseTable/BaseTable';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { TablePagination } from '../../../components/Pagination';
import ErrorState from '../../../components/ErrorState/ErrorState';

import type { IEmployee, EmployeeFormValues } from '../types';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { ImportPreviewModal } from '../components/ImportPreviewModal';
import { useGetEmployees } from '../api/get-employees';
import { useCreateEmployee } from '../api/create-employee';
import { useUpdateEmployee } from '../api/update-employee';
import { useImportEmployees } from '../api/import-employees';
import { usePreviewImport, type PreviewEmployee } from '../api/preview-import';
import { exportEmployees } from '../api/export-employees';
import { Loading } from '../../../components/Loading/Loading';
import { notify } from '../../../components/Notification';
import { mapEmployeeToFormValues } from '../utils/employee-mapper';

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [opened, setOpened] = useState(false);
  const [editEmployee, setEditEmployee] = useState<IEmployee | null>(null);

  const [previewOpened, setPreviewOpened] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewEmployee[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const isEdit = Boolean(editEmployee);

  const { data, isLoading, error, refetch } = useGetEmployees({
    pageIndex: page,
    pageSize,
    search: search || undefined,
    filter: filter || undefined,
  });

  const employees = data?.data || [];
  const totalCount = data?.count || 0;

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const importMutation = useImportEmployees();
  const previewMutation = usePreviewImport();

  const handleAdd = () => {
    setEditEmployee(null);
    setOpened(true);
  };

  const handleEdit = (employee: IEmployee) => {
    setEditEmployee(employee);
    setOpened(true);
  };

  const handleSubmit = async (values: EmployeeFormValues, id?: string) => {
    const notiId = notify.loading(isEdit ? 'Updating employee...' : 'Creating employee...');

    try {
      const payload = {
        employee_code: values.employee_code,
        full_name: values.full_name,
        display_name: values.display_name,
        email: values.email,
        phone: values.phone,
        identify_card: values.identify_card,
        gender: values.gender,
        date_of_birth:
          values.date_of_birth instanceof Date
            ? values.date_of_birth.toISOString()
            : values.date_of_birth,
        address: values.address,
        hire_date:
          values.hire_date instanceof Date
            ? values.hire_date.toISOString()
            : values.hire_date || new Date().toISOString(),
        position_id: values.position_id,
        status: values.status,
        work_schedules: values.work_schedules,
      };

      if (isEdit && id) {
        await updateMutation.mutateAsync({
          id,
          payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }

      notify.success(notiId, {
        message: isEdit ? 'Employee updated successfully' : 'Employee created successfully',
      });

      setOpened(false);
      setEditEmployee(null);
    } catch (e: any) {
      notify.error(notiId, {
        message:
          e?.response?.data?.message ||
          (isEdit ? 'Update employee failed' : 'Create employee failed'),
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (value: string | null) => {
    setFilter(value);
    setPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  const handleExport = async () => {
    const notiId = notify.loading('Exporting employees...');
    try {
      const blob = await exportEmployees();
      saveAs(blob, `employees_${new Date().getTime()}.xlsx`);
      notify.success(notiId, { message: 'Employees exported successfully' });
    } catch (error: any) {
      notify.error(notiId, { message: 'Export failed' });
    }
  };

  const handleImportFile = async (file: File | null) => {
    console.log('Uploading ....');
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    const notiId = notify.loading('Loading preview...');
    try {
      const result = await previewMutation.mutateAsync(file);
      console.log('Preview result:', result);
      setPreviewData(result.data);
      setPreviewOpened(true);
      notify.success(notiId, { message: 'Preview loaded successfully' });
    } catch (error: any) {
      console.error('Preview error:', error);
      notify.error(notiId, {
        message: error?.response?.data?.message || 'Failed to load preview',
      });
    }
  };

  const handleConfirmImport = async () => {
    const notiId = notify.loading('Importing employees...');
    try {
      const result = await importMutation.mutateAsync(previewData);
      notify.success(notiId, {
        message: `Imported: ${result.data.imported}, Failed: ${result.data.failed}`,
      });
      setPreviewOpened(false);
      setPreviewData([]);
    } catch (error: any) {
      notify.error(notiId, {
        message: error?.response?.data?.message || 'Import failed',
      });
    }
  };

  const handleCloseModal = () => {
    setOpened(false);
    setEditEmployee(null);
  };

  const handleClosePreview = () => {
    setPreviewOpened(false);
    setPreviewData([]);
  };

  const columns: TableColumn<IEmployee>[] = [
    {
      key: 'employee_code',
      title: 'Code',
      sortable: true,
    },
    {
      key: 'full_name',
      title: 'Name',
      sortable: true,
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
    },
    {
      key: 'phone',
      title: 'Phone',
      render: (row) => row.phone || '-',
    },
    {
      key: 'position.position_name',
      title: 'Position',
      render: (row) =>
        row.position ? (
          <Badge variant="light" color="cyan" fw={400}>
            {row.position.position_name}
          </Badge>
        ) : (
          <Badge variant="light" color="gray" fw={400}>
            Unknown
          </Badge>
        ),
      sortable: true,
    },
    {
      key: 'hire_date',
      title: 'Hire Date',
      sortable: true,
      render: (row) => new Date(row.hire_date).toLocaleDateString('vi-VN'),
    },
    {
      key: 'status',
      title: 'Status',
      align: 'center',
      render: (row) => (
        <Badge variant="light" color={row.status === 'active' ? 'green' : 'gray'} fw={400}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'action',
      title: 'Actions',
      align: 'center',
      render: (row) => (
        <Group gap="xs" justify="center">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => navigate(`/employees/${row.id}/profile`)}
            title="View Profile"
          >
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" onClick={() => handleEdit(row)} title="Edit">
            <IconEdit size={16} />
          </ActionIcon>
        </Group>
      ),
    },
  ];

  if (error) {
    return <ErrorState message={`Error loading employees: ${error.message}`} onRetry={refetch} />;
  }

  return (
    <Stack gap="md">
      <PageHeader
        title="Employees"
        description="Manage your workforce — add, edit, and organize employees"
        right={
          <Group>
            <Button onClick={handleAdd}>Add employee</Button>
            <Menu shadow="md" width={200} position="bottom-start">
              <Menu.Target>
                <Button variant="light" leftSection={<IconDotsVertical size={16} />}>
                  Actions
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  variant="light"
                  leftSection={<IconSitemap size={16} />}
                  onClick={() => navigate('/employees/org-chart')}
                >
                  View Org Chart
                </Menu.Item>
                <Menu.Item leftSection={<IconFileExport size={16} />} onClick={handleExport}>
                  Export to Excel
                </Menu.Item>
                <FileButton onChange={handleImportFile} accept=".xlsx,.xls">
                  {(props) => (
                    <Menu.Item
                      {...props}
                      leftSection={<IconFileImport size={16} />}
                      closeMenuOnClick={false}
                    >
                      Import from Excel
                    </Menu.Item>
                  )}
                </FileButton>
              </Menu.Dropdown>
            </Menu>
            <TextInput
              placeholder="Search by name, email or code"
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => handleSearch(e.currentTarget.value)}
            />

            <Select
              placeholder="Filter by status"
              clearable
              w={100}
              data={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={filter}
              onChange={handleFilterChange}
            />
          </Group>
        }
      />

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <BaseTable
            data={employees}
            columns={columns}
            withTableBorder
            withColumnBorders
            stickyHeader
            withCheckbox
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
          />

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              handlePageSizeChange(size);
            }}
          />
        </>
      )}

      <EmployeeFormModal
        opened={opened}
        onClose={() => {
          handleCloseModal();
        }}
        mode={isEdit ? 'edit' : 'add'}
        initialValues={mapEmployeeToFormValues(editEmployee)}
        employeeId={editEmployee?.id}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <ImportPreviewModal
        opened={previewOpened}
        onClose={handleClosePreview}
        data={previewData}
        onConfirm={handleConfirmImport}
        loading={importMutation.isPending}
      />
    </Stack>
  );
}
