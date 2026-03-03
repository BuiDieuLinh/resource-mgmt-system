import { Stack, Button, Group, TextInput, ActionIcon, Badge, Select } from '@mantine/core';
import { IconSearch, IconEdit, IconPlus } from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { BaseTable, type TableColumn } from '../../../components/BaseTable/BaseTable';
import { TablePagination } from '../../../components/Pagination';
import { Loading } from '../../../components/Loading/Loading';
import ErrorState from '../../../components/ErrorState/ErrorState';
import { useGetPositions } from '../../positions/api/get-positions';
import { useGetAllDepartments } from '../../departments/api/get-departments';
import type { IPosition } from '../../positions/types';

export default function PositionsPage() {
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, error, refetch } = useGetPositions({
    pageIndex: page,
    pageSize,
    search: search || undefined,
    department_id: departmentFilter || undefined,
  });

  const { data: departmentsData } = useGetAllDepartments();
  const departments = departmentsData?.data || [];

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
      title: 'Position Name',
      sortable: true,
      width: 250,
    },
    {
      key: 'level',
      title: 'Level',
      sortable: true,
      width: 150,
      render: (row) => (
        <Badge variant="light" color="deepPurple" tt="capitalize" fw={400}>
          {row.level}
        </Badge>
      ),
    },
    {
      key: 'department_id',
      title: 'Department',
      sortable: true,
      width: 200,
      render: (row) => {
        const deptName = departmentMap.get(row.department_id);
        return deptName || '-';
      },
    },
    {
      key: 'description',
      title: 'Description',
      render: (row) => row.description || '-',
    },
    {
      key: 'action',
      title: 'Actions',
      align: 'center',
      width: 100,
      render: (row) => (
        <ActionIcon variant="subtle" color="gray">
          <IconEdit size={16} />
        </ActionIcon>
      ),
    },
  ];

  if (error) {
    return <ErrorState message={`Error loading positions: ${error.message}`} onRetry={refetch} />;
  }

  return (
    <Stack gap="md">
      <Group>
        <Button leftSection={<IconPlus size={16} />}>Add Position</Button>

        <TextInput
          placeholder="Search positions..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => handleSearch(e.currentTarget.value)}
        />

        <Select
          placeholder="Filter by department"
          clearable
          data={departments.map((dept) => ({
            value: dept.id,
            label: dept.department_name,
          }))}
          value={departmentFilter}
          onChange={handleDepartmentFilter}
        />
      </Group>

      {isLoading ? (
        <Loading />
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
    </Stack>
  );
}
