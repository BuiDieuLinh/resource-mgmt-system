import { Group, Pagination, Select } from "@mantine/core";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPage = Math.ceil(total / pageSize);

  return (
    <Group justify="flex-end" mt="md">
      <Pagination
        value={page}
        total={totalPage}
        onChange={onPageChange}
        withEdges
      />

      <Select
        value={String(pageSize)}
        data={['10', '20', '50']}
        onChange={(v) => onPageSizeChange(Number(v))}
        w={80}
      />
    </Group>
  );
}
