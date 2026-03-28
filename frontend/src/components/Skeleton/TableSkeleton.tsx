import { Skeleton, Table } from '@mantine/core';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  colWidths?: number[];
}

export function TableSkeleton({ rows = 7, cols = 5, colWidths }: TableSkeletonProps) {
  const widths = colWidths ?? Array.from({ length: cols }, (_, i) => 80 + i * 30);
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          {widths.map((w, i) => (
            <Table.Th key={i}>
              <Skeleton h={12} w={w} radius="sm" />
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <Table.Tr key={r}>
            {widths.map((w, c) => (
              <Table.Td key={c}>
                <Skeleton h={12} w={Math.round(w * 0.75)} radius="sm" />
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
