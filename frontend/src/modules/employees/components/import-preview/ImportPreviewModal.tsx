import { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  Stack,
  Group,
  Button,
  Text,
  Badge,
  ScrollArea,
  Table,
  Checkbox,
  Alert,
  Progress,
  Divider,
  Tooltip,
} from '@mantine/core';
import { IconAlertTriangle, IconCheck, IconInfoCircle } from '@tabler/icons-react';
import { PRIMARY_COLOR } from '@/theme';
import { InlineCell } from './InlineCell';
import { COLUMNS, type PreviewEmployee } from './types';
import { validateRow, dropServerErrorsForField, getColumnError } from './validation';
import s from './import-preview/ImportPreview.module.css';

export type { PreviewEmployee };

interface ImportPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  data: PreviewEmployee[];
  onConfirm: (selected: PreviewEmployee[]) => void;
  loading?: boolean;
}

export function ImportPreviewModal({
  opened,
  onClose,
  data,
  onConfirm,
  loading = false,
}: ImportPreviewModalProps) {
  const [rows, setRows] = useState<PreviewEmployee[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    const initialRows = data.map((r, i) => {
      const serverErrors = r.errors ?? [];
      const clientErrors = validateRow(r, data, i);
      return { ...r, serverErrors, errors: [...new Set([...serverErrors, ...clientErrors])] };
    });
    setRows(initialRows);
    const autoSel = new Set<number>();
    initialRows.forEach((r, i) => {
      if (!r.errors?.length) autoSel.add(i);
    });
    setSelected(autoSel);
  }, [data]);

  const validCount = rows.filter((r) => !r.errors?.length).length;
  const errorCount = rows.filter((r) => (r.errors?.length ?? 0) > 0).length;
  const selectedCount = selected.size;
  const canImport = validCount > 0;

  const toggleRow = (idx: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

  const toggleAll = () =>
    setSelected(selected.size === rows.length ? new Set() : new Set(rows.map((_, i) => i)));

  const selectValidOnly = () => {
    const s = new Set<number>();
    rows.forEach((r, i) => {
      if (!r.errors?.length) s.add(i);
    });
    setSelected(s);
  };

  const handleCellCommit = useCallback(
    (rowIdx: number, field: keyof PreviewEmployee, value: string) => {
      setRows((prev) => {
        const next = prev.map((r, i) => (i === rowIdx ? { ...r, [field]: value } : r));
        const revalidated = next.map((r, i) => {
          const remainingServerErrors = dropServerErrorsForField(
            r.serverErrors ?? [],
            field as string,
          );
          const clientErrors = validateRow(r, next, i);
          return {
            ...r,
            serverErrors: remainingServerErrors,
            errors: [...new Set([...remainingServerErrors, ...clientErrors])],
          };
        });
        setSelected((prevSel) => {
          const newSel = new Set(prevSel);
          revalidated.forEach((r, i) => {
            if (!r.errors?.length) newSel.add(i);
          });
          return newSel;
        });
        return revalidated;
      });
    },
    [],
  );

  const handleConfirm = () => onConfirm(rows.filter((_, i) => selected.has(i)));

  const selectedWithErrors = rows.filter(
    (_, i) => selected.has(i) && (rows[i].errors?.length ?? 0) > 0,
  ).length;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Text fw={700} size="lg" c={PRIMARY_COLOR}>
            Import Preview
          </Text>
          <Badge size="md" variant="light" color={PRIMARY_COLOR}>
            {rows.length} rows
          </Badge>
          {validCount > 0 && (
            <Badge size="md" variant="light" color="teal">
              {validCount} valid
            </Badge>
          )}
          {errorCount > 0 && (
            <Badge size="md" variant="light" color="red">
              {errorCount} errors
            </Badge>
          )}
        </Group>
      }
      size="100%"
      styles={{
        header: {
          borderBottom: '1px solid var(--mantine-color-default-border)',
          paddingBottom: 12,
        },
        body: { padding: 16 },
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Text size="sm" c="dimmed">
              {selectedCount} of {rows.length} selected
            </Text>
            <Button size="xs" variant="subtle" onClick={selectValidOnly}>
              Valid only
            </Button>
            <Button size="xs" variant="subtle" onClick={toggleAll}>
              {selected.size === rows.length ? 'Deselect all' : 'Select all'}
            </Button>
          </Group>
          <Group gap="xs">
            <Progress
              value={rows.length > 0 ? (validCount / rows.length) * 100 : 0}
              color="teal"
              size="sm"
              w={100}
            />
            <Text size="xs" c="dimmed">
              {rows.length > 0 ? Math.round((validCount / rows.length) * 100) : 0}% valid
            </Text>
          </Group>
        </Group>

        {errorCount > 0 && (
          <Alert icon={<IconAlertTriangle size={14} />} color="orange" p="xs">
            {errorCount} row(s) have errors. Click any cell to edit inline — validation updates
            instantly.
          </Alert>
        )}

        {!canImport && rows.length > 0 && (
          <Alert icon={<IconAlertTriangle size={14} />} color="red" p="xs">
            No valid rows to import. Fix the errors above before importing.
          </Alert>
        )}

        <ScrollArea h="calc(100vh - 320px)" type="auto">
          <Table withTableBorder withColumnBorders className={s.table}>
            <Table.Thead className={s.thead}>
              <Table.Tr>
                <Table.Th w={36}>
                  <Checkbox
                    checked={selected.size === rows.length && rows.length > 0}
                    indeterminate={selected.size > 0 && selected.size < rows.length}
                    onChange={toggleAll}
                    size="xs"
                  />
                </Table.Th>
                <Table.Th w={40} className={s.th}>
                  #
                </Table.Th>
                <Table.Th w={80} className={s.th}>
                  Status
                </Table.Th>
                {COLUMNS.map((col) => (
                  <Table.Th key={col.key} w={col.width} className={s.th}>
                    {col.label}
                    {col.required && (
                      <Text span c="red" size="xs">
                        {' '}
                        *
                      </Text>
                    )}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {rows.map((row, rowIdx) => {
                const hasError = (row.errors?.length ?? 0) > 0;
                const isSelected = selected.has(rowIdx);

                const rowClass = [
                  hasError ? s.rowError : isSelected ? s.rowValid : '',
                  !isSelected ? s.rowDimmed : '',
                ].join(' ');

                return (
                  <Table.Tr key={rowIdx} className={rowClass}>
                    <Table.Td>
                      <Checkbox checked={isSelected} onChange={() => toggleRow(rowIdx)} size="xs" />
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {row.row_number ?? rowIdx + 2}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {hasError ? (
                        <Tooltip
                          label={
                            <Stack gap={2}>
                              {row.errors!.map((e, i) => (
                                <Text key={i} size="xs">
                                  • {e}
                                </Text>
                              ))}
                            </Stack>
                          }
                          multiline
                          w={280}
                          withArrow
                        >
                          <Badge size="xs" color="red" variant="light" style={{ cursor: 'help' }}>
                            {row.errors!.length} err
                          </Badge>
                        </Tooltip>
                      ) : (
                        <Badge size="xs" color="teal" variant="light">
                          <IconCheck size={10} style={{ marginRight: 2 }} />
                          OK
                        </Badge>
                      )}
                    </Table.Td>

                    {COLUMNS.map((col, colIdx) => {
                      const value = String(row[col.key] ?? '');
                      const errorMsg = getColumnError(row.errors, col);
                      const unmappedErrs =
                        colIdx === 0 && hasError
                          ? row.errors?.filter((e) => !COLUMNS.some((c) => getColumnError([e], c)))
                          : [];

                      return (
                        <Table.Td key={col.key} className={errorMsg ? s.cellError : s.cellNormal}>
                          <InlineCell
                            value={value}
                            hasError={!!errorMsg || (colIdx === 0 && !!unmappedErrs?.length)}
                            errorMsg={errorMsg ?? unmappedErrs?.[0]}
                            onCommit={(v) => handleCellCommit(rowIdx, col.key, v)}
                          />
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        <Text size="xs" c="dimmed">
          <IconInfoCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Click any cell to edit. Enter to confirm, Escape to cancel. Dates must be YYYY-MM-DD.
        </Text>

        <Divider />

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {selectedCount} row(s) selected
            {selectedWithErrors > 0 && (
              <Text span c="orange">
                {' '}
                · {selectedWithErrors} with errors
              </Text>
            )}
          </Text>
          <Group gap="sm">
            <Button variant="subtle" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            {canImport && (
              <Button
                color={PRIMARY_COLOR}
                loading={loading}
                disabled={selectedCount === 0}
                onClick={handleConfirm}
                leftSection={<IconCheck size={14} />}
              >
                Import {selectedCount} Employee{selectedCount !== 1 ? 's' : ''}
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
