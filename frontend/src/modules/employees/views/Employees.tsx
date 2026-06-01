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
  Tooltip,
} from '@mantine/core';
import {
  IconEdit,
  IconSearch,
  IconEye,
  IconSitemap,
  IconFileExport,
  IconFileImport,
  IconDotsVertical,
  IconPlus,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { BaseTable, type TableColumn } from '@/components/BaseTable/BaseTable';
import { PageHeader } from '@/components/PageHeader/PageHeader';
import { TablePagination } from '@/components/Pagination';
import ErrorState from '@/components/ErrorState/ErrorState';

import type { IEmployee, EmployeeFormValues } from '../types';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { ImportPreviewModal } from '../components/import-preview/ImportPreviewModal';
import { useGetEmployees } from '../api/get-employees';
import { useCreateEmployee } from '../api/create-employee';
import { useUpdateEmployee } from '../api/update-employee';
import { useImportEmployees } from '../api/import-employees';
import { usePreviewImport, type PreviewEmployee } from '../api/preview-import';
import { exportEmployees } from '../api/export-employees';
import { notify } from '@/components/Notification';
import { mapEmployeeToFormValues } from '../utils/employee-mapper';
import {
  EMPLOYEE_ROLE,
  formatDate,
  CONTRACT_TYPE_COLOR,
  CONTRACT_TYPE_LABEL,
  type ContractType,
} from '@/constant';
import { TableSkeleton } from '@/components/Skeleton/TableSkeleton';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { normalizeString } from '../utils/search';
import { useHasRole } from '@/hooks/useHasRole';
import { useTranslation } from 'react-i18next';

export default function EmployeesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
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
  const isAdmin = useHasRole(EMPLOYEE_ROLE.ADMIN, EMPLOYEE_ROLE.HR);

  const {
    data,
    isLoading: _loading,
    error,
    refetch,
  } = useGetEmployees({
    pageIndex: page,
    pageSize,
    search: search || undefined,
    filter: filter || undefined,
  });
  const isLoading = useDelayedLoading(_loading);

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
    const notiId = notify.loading(
      isEdit ? t('employee.updatingEmployee') : t('employee.creatingEmployee'),
    );

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
        contract_type: values.contract_type,
        manager_id: values.manager_id,
        terminated_at: values.terminated_at,
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
        message: isEdit ? t('employee.employeeUpdated') : t('employee.employeeCreated'),
      });

      setOpened(false);
      setEditEmployee(null);
    } catch (e: any) {
      notify.error(notiId, {
        message:
          e?.response?.data?.message ||
          (isEdit ? t('employee.employeeUpdateFailed') : t('employee.employeeCreateFailed')),
      });
    }
  };

  const handleSearch = (value: string) => {
    setInput(value);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const cleaned = normalizeString(input);
      setSearch(cleaned);
      setPage(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [input]);

  const handleFilterChange = (value: string | null) => {
    setFilter(value);
    setPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  const handleExport = async () => {
    const notiId = notify.loading(t('employee.exportingEmployees'));
    try {
      const blob = await exportEmployees();
      saveAs(blob, `employees_${new Date().getTime()}.xlsx`);
      notify.success(notiId, { message: t('employee.employeesExported') });
    } catch (error: any) {
      notify.error(notiId, { message: t('employee.exportFailed') });
    }
  };

  const handleImportFile = async (file: File | null) => {
    console.log('Uploading ....');
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    const notiId = notify.loading(t('employee.loadingPreview'));
    try {
      const result = await previewMutation.mutateAsync(file);
      console.log('Preview result:', result);
      setPreviewData(result.data);
      setPreviewOpened(true);
      notify.success(notiId, { message: t('employee.previewLoaded') });
    } catch (error: any) {
      console.error('Preview error:', error);
      notify.error(notiId, {
        message: error?.response?.data?.message || t('employee.previewLoadFailed'),
      });
    }
  };

  const handleConfirmImport = async (selectedRows: PreviewEmployee[]) => {
    const notiId = notify.loading(t('employee.importingEmployees', { count: selectedRows.length }));
    try {
      const result = await importMutation.mutateAsync(selectedRows);
      notify.success(notiId, {
        message: t('employee.importResult', {
          imported: result.data.imported,
          failed: result.data.failed,
        }),
      });
      setPreviewOpened(false);
      setPreviewData([]);
    } catch (error: any) {
      notify.error(notiId, {
        message: error?.response?.data?.message || t('employee.importFailed'),
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
      title: t('importPreview.code'),
      sortable: true,
    },
    {
      key: 'full_name',
      title: t('employee.fullName'),
      sortable: true,
    },
    {
      key: 'email',
      title: t('employee.email'),
      sortable: true,
    },
    {
      key: 'phone',
      title: t('employee.phone'),
      render: (row) => row.phone || t('common.notAvailable'),
    },
    {
      key: 'position.position_name',
      title: t('employee.position'),
      align: 'center',
      render: (row) =>
        row.position ? (
          <Tooltip label={row.position.position_name} position="top" withArrow>
            <Badge variant="light" color="cyan" fw={400} size="sm">
              {row.position.position_name}
            </Badge>
          </Tooltip>
        ) : (
          <Tooltip label={t('employee.unknownPosition')} position="top" withArrow>
            <Badge variant="light" color="gray" fw={400}>
              {t('employee.unknown')}
            </Badge>
          </Tooltip>
        ),
      sortable: true,
    },
    {
      key: 'contract_type',
      title: t('employee.contractType'),
      align: 'center',
      render: (row) => (
        <Badge
          variant="light"
          color={CONTRACT_TYPE_COLOR[row.contract_type as ContractType] || 'gray'}
          fw={400}
          size="sm"
        >
          {CONTRACT_TYPE_LABEL[row.contract_type as ContractType] || row.contract_type}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'hire_date',
      title: t('employee.hireDate'),
      sortable: true,
      render: (row) => formatDate(row.hire_date),
    },
    {
      key: 'status',
      title: t('employee.status'),
      align: 'center',
      render: (row) => (
        <Tooltip
          label={
            row.status === 'active' ? t('employee.activeEmployee') : t('employee.inactiveEmployee')
          }
          position="top"
          withArrow
        >
          <Badge
            variant="light"
            color={row.status === 'active' ? 'green' : 'gray'}
            fw={400}
            size="sm"
          >
            {row.status}
          </Badge>
        </Tooltip>
      ),
    },
    {
      key: 'action',
      title: t('actions.actions'),
      align: 'center',
      fixed: 'right',
      render: (row) => (
        <Group gap="xs" justify="center" wrap="nowrap">
          <Tooltip label={t('employee.viewProfile')} withArrow>
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => navigate(`/employees/${row.id}/profile`)}
            >
              <IconEye size={18} />
            </ActionIcon>
          </Tooltip>
          {isAdmin && (
            <Tooltip label={t('common.edit')}>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => handleEdit(row)}
                title={t('common.edit')}
              >
                <IconEdit size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      ),
    },
  ];

  if (error) {
    return (
      <ErrorState
        message={t('employee.errorLoadingEmployees', { message: error.message })}
        onRetry={refetch}
      />
    );
  }

  return (
    <Stack gap="md">
      <PageHeader
        title={t('pages.employeesTitle')}
        description={t('pages.employeesDescription')}
        right={
          <Group>
            {isAdmin && (
              <Button leftSection={<IconPlus size={18} />} onClick={handleAdd}>
                {t('actions.addEmployee')}
              </Button>
            )}
            <Menu shadow="md" width={200} position="bottom-start">
              <Menu.Target>
                <Button variant="light" leftSection={<IconDotsVertical size={18} />}>
                  {t('actions.actions')}
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  variant="light"
                  leftSection={<IconSitemap size={18} />}
                  onClick={() => navigate('/employees/org-chart')}
                >
                  {t('actions.viewOrgChart')}
                </Menu.Item>
                {isAdmin && (
                  <>
                    <Menu.Item leftSection={<IconFileExport size={18} />} onClick={handleExport}>
                      {t('actions.exportExcel')}
                    </Menu.Item>
                  </>
                )}
                {isAdmin && (
                  <FileButton onChange={handleImportFile} accept=".xlsx,.xls">
                    {(props) => (
                      <Menu.Item
                        {...props}
                        leftSection={<IconFileImport size={18} />}
                        closeMenuOnClick={false}
                      >
                        {t('actions.importFromExcel')}
                      </Menu.Item>
                    )}
                  </FileButton>
                )}
              </Menu.Dropdown>
            </Menu>
            <TextInput
              placeholder={t('fields.searchByNameEmailCode')}
              leftSection={<IconSearch size={18} />}
              value={input}
              onChange={(e) => handleSearch(e.currentTarget.value)}
            />

            <Select
              checkIconPosition="right"
              placeholder={t('fields.filterByStatus')}
              clearable
              w={100}
              data={[
                { value: 'active', label: t('common.active') },
                { value: 'inactive', label: t('common.inactive') },
              ]}
              value={filter}
              onChange={handleFilterChange}
            />
          </Group>
        }
      />

      {isLoading ? (
        <TableSkeleton colWidths={[120, 160, 200, 100, 130, 90, 100, 100, 80, 80]} />
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
