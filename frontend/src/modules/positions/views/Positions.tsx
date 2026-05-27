import { Stack, Button, Group, TextInput, ActionIcon, Badge, Select } from '@mantine/core';
import { IconSearch, IconEdit, IconPlus } from '@tabler/icons-react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useState, useMemo } from 'react';
import { BaseTable, type TableColumn } from '../../../components/BaseTable/BaseTable';
import { TablePagination } from '../../../components/Pagination';
import ErrorState from '../../../components/ErrorState/ErrorState';
import { useGetPositions } from '../../positions/api/get-positions';
import { TableSkeleton } from '../../../components/Skeleton/TableSkeleton';
import { useDelayedLoading } from '../../../hooks/useDelayedLoading';
import { useGetAllDepartments } from '../../departments/api/get-departments';
import { useCreatePosition } from '../api/create-position';
import { useUpdatePosition } from '../api/update-position';
import { PositionFormModal } from '../components/PositionFormModal';
import { mapPositionToFormValues } from '../utils/position-mapper';
import { notify } from '../../../components/Notification';
import type { IPosition, PositionFormValues } from '../../positions/types';
import { LEVEL_LABEL, LEVEL_COLOR, type LevelPosition } from '@/constant';
import { useTranslation } from 'react-i18next';

export default function PositionsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [opened, setOpened] = useState(false);
  const [editPosition, setEditPosition] = useState<IPosition | null>(null);

  const isEdit = Boolean(editPosition);

  const {
    data,
    isLoading: _loading,
    error,
    refetch,
  } = useGetPositions({
    pageIndex: page,
    pageSize,
    search: search || undefined,
    department_id: departmentFilter || undefined,
  });
  const isLoading = useDelayedLoading(_loading);

  const { data: departmentsData } = useGetAllDepartments();
  const departments = departmentsData?.data || [];

  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();

  const handleAdd = () => {
    setEditPosition(null);
    setOpened(true);
  };

  const handleEdit = (position: IPosition) => {
    setEditPosition(position);
    setOpened(true);
  };

  const handleSubmit = async (values: PositionFormValues, id?: string) => {
    const notiId = notify.loading(
      isEdit ? t('position.updatingPosition') : t('position.creatingPosition'),
    );

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({
          id,
          payload: values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }

      notify.success(notiId, {
        message: isEdit ? t('position.positionUpdated') : t('position.positionCreated'),
      });

      setOpened(false);
      setEditPosition(null);
    } catch (e: any) {
      notify.error(notiId, {
        message:
          e?.response?.data?.message ||
          (isEdit ? t('position.positionUpdateFailed') : t('position.positionCreateFailed')),
      });
    }
  };

  const handleCloseModal = () => {
    setOpened(false);
    setEditPosition(null);
  };

  const departmentMap = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((dept) => {
      map.set(dept.id, dept.department_name);
    });
    return map;
  }, [departments]);

  const positions = data?.data || [];
  const totalCount = data?.count || 0;

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDepartmentFilter = (value: string | null) => {
    setDepartmentFilter(value);
    setPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  const columns: TableColumn<IPosition>[] = [
    {
      key: 'position_name',
      title: t('position.positionName'),
      sortable: true,
      width: 250,
    },
    {
      key: 'level',
      title: t('position.level'),
      sortable: true,
      width: 150,
      render: (row) => (
        <Badge variant="light" color={LEVEL_COLOR[row.level as LevelPosition] ?? 'gray'} fw={400}>
          {LEVEL_LABEL[row.level as LevelPosition] ?? row.level}
        </Badge>
      ),
    },
    {
      key: 'department_id',
      title: t('position.department'),
      sortable: true,
      width: 200,
      render: (row) => {
        const deptName = departmentMap.get(row.department_id);
        return deptName || t('position.noDepartment');
      },
    },
    {
      key: 'description',
      title: t('position.description'),
      render: (row) => row.description || t('position.noDescription'),
    },
    {
      key: 'action',
      title: t('position.actions'),
      align: 'center',
      width: 100,
      render: (row) => (
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={() => handleEdit(row)}
          title={t('common.edit')}
        >
          <IconEdit size={18} />
        </ActionIcon>
      ),
    },
  ];

  if (error) {
    return (
      <ErrorState
        message={t('position.errorLoadingPositions', { message: error.message })}
        onRetry={refetch}
      />
    );
  }

  return (
    <Stack gap="md">
      <PageHeader
        title={t('pages.positionsTitle')}
        description={t('pages.positionsDescription')}
        right={
          <Group gap="md" justify="space-between">
            <Button leftSection={<IconPlus size={18} />} onClick={handleAdd}>
              {t('actions.addPosition')}
            </Button>
            <TextInput
              placeholder={t('fields.searchPositions')}
              leftSection={<IconSearch size={18} />}
              value={search}
              onChange={(e) => handleSearch(e.currentTarget.value)}
            />
            <Select
              checkIconPosition="right"
              placeholder={t('fields.filterByDepartment')}
              clearable
              data={departments.map((dept) => ({
                value: dept.id,
                label: dept.department_name,
              }))}
              value={departmentFilter}
              onChange={handleDepartmentFilter}
            />
          </Group>
        }
      />

      {isLoading ? (
        <TableSkeleton colWidths={[200, 100, 160, 260, 80]} />
      ) : (
        <>
          <BaseTable
            data={positions}
            columns={columns}
            withTableBorder
            withColumnBorders
            stickyHeader
          />

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={totalCount}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      <PositionFormModal
        opened={opened}
        onClose={handleCloseModal}
        mode={isEdit ? 'edit' : 'add'}
        initialValues={mapPositionToFormValues(editPosition)}
        positionId={editPosition?.id}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </Stack>
  );
}
