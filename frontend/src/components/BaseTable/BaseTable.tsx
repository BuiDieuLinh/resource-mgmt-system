import {
  Table,
  ScrollArea,
  Center,
  Loader,
  Text,
} from '@mantine/core';
import {
  IconChevronUp,
  IconChevronDown,
  IconSelector,
} from '@tabler/icons-react';
import { useMemo, useState, type ReactNode } from 'react';
import cx from 'clsx';
import classes from './BaseTable.module.css';

export type TableColumn<T> = {
  key: keyof T | string;
  title: ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';

  render?: (row: T, index: number) => ReactNode;

  sortable?: boolean;
  sortAccessor?: (row: T) => string | number;
};

type SortState<T> = {
  key: TableColumn<T>['key'] | null;
  direction: 'asc' | 'desc';
};

export type BaseTableProps<T> = {
  data: T[];
  columns: TableColumn<T>[];

  loading?: boolean;
  emptyText?: ReactNode;

  striped?: boolean;
  highlightOnHover?: boolean;
  withTableBorder?: boolean;
  withColumnBorders?: boolean;

  stickyHeader?: boolean;
  height?: number;

  onRowClick?: (row: T) => void;
};

export function BaseTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyText = 'No data',
  striped = true,
  highlightOnHover = true,
  withTableBorder = false,
  withColumnBorders = false,
  stickyHeader = true,
  height = 500,
  onRowClick,
}: BaseTableProps<T>) {
  const [scrolled, setScrolled] = useState(false);

  const [sort, setSort] = useState<SortState<T> | null>(null);

  const handleSort = (col: TableColumn<T>) => {
    if (!col.sortable) return;

    setSort((prev) => {
      if (!prev || prev.key !== col.key) {
        return { key: col.key, direction: 'asc' };
      }

      return {
        key: col.key,
        direction: prev.direction === 'asc' ? 'desc' : 'asc',
      };
    });
  };

  const sortedData = useMemo(() => {
    if (!sort) return data;

    const column = columns.find((c) => c.key === sort.key);
    if (!column) return data;

    const getValue = (row: T) =>
      column.sortAccessor
        ? column.sortAccessor(row)
        : row[sort.key as keyof T];

    return [...data].sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);

      if (aVal == null || bVal == null) return 0;

        if (typeof aVal === 'string' && typeof bVal === 'string') {
        const aStr = String(aVal);
        const bStr = String(bVal);

        return sort.direction === 'asc'
            ? aStr.localeCompare(bStr)
            : bStr.localeCompare(aStr);
        }

      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      return 0;
    });
  }, [data, sort, columns]);

  return (
    <ScrollArea
      h={height}
      onScrollPositionChange={({ y }) => setScrolled(y !== 0)}
    >
      <Table
        striped={striped}
        highlightOnHover={highlightOnHover}
        withTableBorder={withTableBorder}
        withColumnBorders={withColumnBorders}
        stickyHeader={stickyHeader}
        verticalSpacing="sm"
        horizontalSpacing="md"
        miw="100%"
      >
        <Table.Thead
          className={cx(classes.header, {
            [classes.scrolled]: scrolled,
          })}
        >
          <Table.Tr>
            {columns.map((col) => {
              const isSorted = sort?.key === col.key;

              const SortIcon =
                !col.sortable
                    ? IconSelector
                    : !isSorted
                    ? IconSelector
                    : sort!.direction === 'asc'
                    ? IconChevronUp
                    : IconChevronDown;

              return (
                <Table.Th
                  key={String(col.key)}
                  onClick={
                    col.sortable ? () => handleSort(col) : undefined
                  }
                  className={cx(
                    classes.th,
                    col.sortable && classes.thSortable,
                    isSorted && classes.thSorted
                  )}
                  style={{
                    width: col.width,
                    textAlign: col.align ?? 'left',
                    cursor: col.sortable ? 'pointer' : 'default',
                  }}
                >
                  <div className={classes.thInner}>
                    <span>{col.title}</span>

                    {col.sortable && (
                      <SortIcon
                        size={14}
                        className={classes.sortIcon}
                      />
                    )}
                  </div>
                </Table.Th>
              );
            })}
          </Table.Tr>
        </Table.Thead>

        {/* ===== BODY ===== */}
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length}>
                <Center py="xl">
                  <Loader size="sm" />
                </Center>
              </Table.Td>
            </Table.Tr>
          ) : sortedData.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length}>
                <Center py="xl">
                  <Text c="dimmed">{emptyText}</Text>
                </Center>
              </Table.Td>
            </Table.Tr>
          ) : (
            sortedData.map((row, index) => (
              <Table.Tr
                key={index}
                onClick={() => onRowClick?.(row)}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
              >
                {columns.map((col) => (
                  <Table.Td
                    key={String(col.key)}
                    style={{ textAlign: col.align ?? 'left' }}
                  >
                    {col.render
                      ? col.render(row, index)
                      : row[col.key as keyof T]}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
