import { Stack, Button, Group, TextInput, ActionIcon } from '@mantine/core';
import { IconSearch, IconEdit, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { BaseTable, type TableColumn } from '../../../components/BaseTable/BaseTable';
import { TablePagination } from '../../../components/Pagination';
import { Loading } from '../../../components/Loading/Loading';
import ErrorState from '../../../components/ErrorState/ErrorState';
import { useGetDepartments } from '../../departments/api/get-departments';
import type { IDepartment } from '../../departments/types';

export default function DepartmentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, error, refetch } = useGetDepartments({
    pageIndex: page,
    pageSize,
    search: search || undefined,
  });

  const departments = data?.data || [];
  const totalCount = data?.count || 0;

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  const columns: TableColumn<IDepartment>[] = [
    {
      key: 'department_code',
      title: 'Code',
      sortable: true,
      width: 120,
    },
    {
      key: 'department_name',
      title: 'Department Name',
      sortable: true,
      width: 250,
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
    return <ErrorState message={`Error loading departments: ${error.message}`} onRetry={refetch} />;
  }

  return (
    <Stack gap="md">
      <Group>
        <Button leftSection={<IconPlus size={16} />}>Add Department</Button>

        <TextInput
          placeholder="Search departments..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => handleSearch(e.currentTarget.value)}
        />
      </Group>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <BaseTable
            data={departments}
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
