import React, { useMemo, useState, type ReactNode } from 'react';
import { Table, Center, Loader, Text, Collapse } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';
import cx from 'clsx';
import classes from './CollapsibleTable.module.css';

export type CollapsibleTableColumn<T> = {
  key: keyof T | string;
  title: ReactNode;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: 'right' | 'left';

  render?: (row: T, index: number) => ReactNode;

  sortable?: boolean;
  sortAccessor?: (row: T) => string | number;
};

type SortState<T> = {
  key: CollapsibleTableColumn<T>['key'] | null;
  direction: 'asc' | 'desc';
};

export type CollapsibleTableProps<T> = {
  data: T[];
  columns: CollapsibleTableColumn<T>[];

  loading?: boolean;
  emptyText?: ReactNode;

  highlightOnHover?: boolean;

  stickyHeader?: boolean;
  height?: number;

  onRowClick?: (row: T) => void;

  collapsible?: boolean;
  renderCollapsedContent?: (row: T, index: number) => ReactNode;
  isRowExpanded?: (row: T, index: number) => boolean;
  onToggleRow?: (row: T, index: number) => void;
  getRowId?: (row: T, index: number) => string;
};

export function CollapsibleTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyText = 'No data',
  highlightOnHover = true,
  stickyHeader = true,
  height = 500,
  onRowClick,
  collapsible = false,
  renderCollapsedContent,
  isRowExpanded,
  onToggleRow,
  getRowId,
}: CollapsibleTableProps<T>) {
  const [scrolled] = useState(false);
  const [sort, setSort] = useState<SortState<T> | null>(null);

  const handleSort = (col: CollapsibleTableColumn<T>) => {
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
    if (!Array.isArray(data)) return [];
    if (!sort) return data;

    const column = columns.find((c) => c.key === sort.key);
    if (!column) return data;

    const getValue = (row: T) =>
      column.sortAccessor ? column.sortAccessor(row) : row[sort.key as keyof T];

    return [...data].sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);

      if (aVal == null || bVal == null) return 0;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const aStr = String(aVal);
        const bStr = String(bVal);

        return sort.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      }

      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      return 0;
    });
  }, [data, sort, columns]);

  return (
    <Table.ScrollContainer minWidth={600} mah={height} type="native">
      <Table
        highlightOnHover={highlightOnHover}
        stickyHeader={stickyHeader}
        verticalSpacing="xs"
        horizontalSpacing="md"
        miw="100%"
        style={{ tableLayout: 'auto' }}
      >
        <Table.Thead
          className={cx(classes.header, {
            [classes.scrolled]: scrolled,
          })}
        >
          <Table.Tr>
            {collapsible && (
              <Table.Th
                className={classes.th}
                style={{ width: 50, textAlign: 'center', whiteSpace: 'nowrap' }}
              />
            )}
            {columns.map((col) => {
              const isSorted = sort?.key === col.key;

              const SortIcon = !col.sortable
                ? IconSelector
                : !isSorted
                  ? IconSelector
                  : sort!.direction === 'asc'
                    ? IconChevronUp
                    : IconChevronDown;

              return (
                <Table.Th
                  key={String(col.key)}
                  onClick={col.sortable ? () => handleSort(col) : undefined}
                  className={cx(
                    classes.th,
                    col.sortable && classes.thSortable,
                    isSorted && classes.thSorted,
                    col.fixed === 'right' && classes.fixedRight,
                    col.fixed === 'left' && classes.fixedLeft,
                  )}
                  style={{
                    width: col.width,
                    textAlign: col.align ?? 'left',
                    cursor: col.sortable ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div className={classes.thInner}>
                    <span>{col.title}</span>
                    {col.sortable && <SortIcon size={14} className={classes.sortIcon} />}
                  </div>
                </Table.Th>
              );
            })}
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length + (collapsible ? 1 : 0)}>
                <Center py="xl">
                  <Loader size="sm" />
                </Center>
              </Table.Td>
            </Table.Tr>
          ) : sortedData.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length + (collapsible ? 1 : 0)}>
                <Center py="xl">
                  <Text c="dimmed">{emptyText}</Text>
                </Center>
              </Table.Td>
            </Table.Tr>
          ) : (
            sortedData.map((row, index) => {
              const rowId = getRowId ? getRowId(row, index) : String(index);
              const isExpanded = isRowExpanded ? isRowExpanded(row, index) : false;

              return (
                <React.Fragment key={rowId}>
                  <Table.Tr
                    onClick={() => onRowClick?.(row)}
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {collapsible && (
                      <Table.Td
                        style={{ textAlign: 'center', whiteSpace: 'nowrap' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleRow?.(row, index);
                        }}
                      >
                        {renderCollapsedContent && (
                          <div style={{ cursor: 'pointer' }}>
                            {isExpanded ? (
                              <IconChevronDown size={16} />
                            ) : (
                              <IconChevronUp size={16} style={{ transform: 'rotate(-90deg)' }} />
                            )}
                          </div>
                        )}
                      </Table.Td>
                    )}
                    {columns.map((col) => (
                      <Table.Td
                        key={String(col.key)}
                        className={cx(
                          col.fixed === 'right' && classes.fixedRight,
                          col.fixed === 'left' && classes.fixedLeft,
                        )}
                        style={{
                          textAlign: col.align ?? 'left',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {col.render ? col.render(row, index) : row[col.key as keyof T]}
                      </Table.Td>
                    ))}
                  </Table.Tr>

                  {collapsible && isExpanded && renderCollapsedContent && (
                    <Table.Tr key={`${rowId}-collapse`}>
                      <Table.Td
                        colSpan={columns.length + 1}
                        p={0}
                        style={{
                          backgroundColor:
                            'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))',
                        }}
                      >
                        <Collapse in={isExpanded}>{renderCollapsedContent(row, index)}</Collapse>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
