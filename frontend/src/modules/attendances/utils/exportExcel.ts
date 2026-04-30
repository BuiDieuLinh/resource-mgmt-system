import ExcelJS from 'exceljs';
import { fmtTime, formatMinutes } from './format';
import { formatDate } from '@/constant';

// ── Styles ────────────────────────────────────────────────────────────────────
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4C3B8F' },
};
const SUBHEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE8E4F5' },
};
const ALT_ROW_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF9F8FE' },
};
const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD0C8EE' } },
  left: { style: 'thin', color: { argb: 'FFD0C8EE' } },
  bottom: { style: 'thin', color: { argb: 'FFD0C8EE' } },
  right: { style: 'thin', color: { argb: 'FFD0C8EE' } },
};

function applyBorder(row: ExcelJS.Row, colCount: number) {
  for (let c = 1; c <= colCount; c++) {
    row.getCell(c).border = BORDER;
  }
}

// ── Summary Export ────────────────────────────────────────────────────────────
export async function exportSummaryExcel(
  rows: any[],
  month: number,
  year: number,
  departmentName = 'All Departments',
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'RMS Core';
  wb.created = new Date();

  const ws = wb.addWorksheet('Attendance Summary');

  const COL_COUNT = 14;

  // ── Title block ──────────────────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, COL_COUNT);
  const titleCell = ws.getCell('A1');
  titleCell.value = 'ATTENDANCE SUMMARY REPORT';
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF4C3B8F' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 28;

  ws.mergeCells(2, 1, 2, COL_COUNT);
  ws.getCell('A2').value =
    `Period: ${String(month).padStart(2, '0')}/${year}   |   Department: ${departmentName}   |   Exported: ${formatDate(new Date().toISOString())}`;
  ws.getCell('A2').font = { size: 10, color: { argb: 'FF666666' } };
  ws.getCell('A2').alignment = { horizontal: 'center' };
  ws.getRow(2).height = 18;

  ws.addRow([]); // spacer

  // ── Column headers ───────────────────────────────────────────────────────
  const headerRow = ws.addRow([
    'No.',
    'Employee',
    'Department',
    'Position',
    'Planned (d)',
    'Actual (d)',
    'Late',
    'Absent (d)',
    'Annual Leave (d)',
    'Unpaid Leave (d)',
    'Holiday (d)',
    'Overtime',
    'Diff',
    'Total (net)',
  ]);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BORDER;
  });

  // ── Data rows ────────────────────────────────────────────────────────────
  rows.forEach((r, i) => {
    const diff = (r.actual_day ?? 0) - (r.plan_day ?? 0);
    const dataRow = ws.addRow([
      i + 1,
      r.employee?.full_name ?? r.employee_id,
      r.employee?.position?.department?.department_name ?? '—',
      r.employee?.position?.position_name ?? '—',
      r.plan_day ?? 0,
      r.actual_day ?? 0,
      formatMinutes(r.late_minutes),
      r.absent ?? 0,
      r.annual_leave ?? 0,
      r.unpaid_leave ?? 0,
      r.holiday_days ?? 0,
      formatMinutes(r.over_time),
      diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${diff}`,
      r.actual_day + r.annual_leave + r.holiday_days,
    ]);

    dataRow.height = 18;
    if (i % 2 === 1) {
      dataRow.eachCell((cell) => {
        cell.fill = ALT_ROW_FILL;
      });
    }
    applyBorder(dataRow, COL_COUNT);

    // Color diff cell
    const diffCell = dataRow.getCell(13);
    if (diff > 0) diffCell.font = { color: { argb: 'FF2E7D32' } };
    else if (diff < 0) diffCell.font = { color: { argb: 'FFC62828' } };

    // Highlight Total (net) cell
    const totalNetCell = dataRow.getCell(14);
    totalNetCell.font = { bold: true, color: { argb: 'FF4C3B8F' } };

    // Color late cell
    if ((r.late_minutes ?? 0) > 0) {
      dataRow.getCell(7).font = { color: { argb: 'FFE65100' } };
    }

    dataRow.eachCell((cell) => {
      cell.alignment = {
        vertical: 'middle',
        horizontal: typeof cell.value === 'number' ? 'center' : 'left',
      };
    });
  });

  // ── Summary footer ───────────────────────────────────────────────────────
  ws.addRow([]);
  const totalRow = ws.addRow([
    '',
    'TOTAL',
    '',
    '',
    rows.reduce((s, r) => s + (r.plan_day ?? 0), 0),
    rows.reduce((s, r) => s + (r.actual_day ?? 0), 0),
    formatMinutes(rows.reduce((s, r) => s + (r.late_minutes ?? 0), 0)),
    rows.reduce((s, r) => s + (r.absent ?? 0), 0),
    rows.reduce((s, r) => s + (r.annual_leave ?? 0), 0),
    rows.reduce((s, r) => s + (r.unpaid_leave ?? 0), 0),
    rows.reduce((s, r) => s + (r.holiday_days ?? 0), 0),
    formatMinutes(rows.reduce((s, r) => s + (r.over_time ?? 0), 0)),
    '',
    rows.reduce(
      (s, r) => s + (r.actual_day ?? 0) + (r.annual_leave ?? 0) + (r.holiday_days ?? 0),
      0,
    ),
  ]);
  totalRow.height = 20;
  totalRow.eachCell((cell) => {
    cell.fill = SUBHEADER_FILL;
    cell.font = { bold: true, size: 10 };
    cell.border = BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // ── Column widths ────────────────────────────────────────────────────────
  ws.columns = [
    { width: 5 }, // No.
    { width: 24 }, // Employee
    { width: 18 }, // Department
    { width: 20 }, // Position
    { width: 11 }, // Planned
    { width: 11 }, // Actual
    { width: 12 }, // Late
    { width: 11 }, // Absent
    { width: 14 }, // Annual Leave
    { width: 13 }, // Unpaid Leave
    { width: 11 }, // Holiday
    { width: 12 }, // Overtime
    { width: 8 }, // Diff
    { width: 14 }, // Total (net)
  ];

  ws.views = [{ state: 'frozen', ySplit: 4 }];

  await downloadWorkbook(
    wb,
    `attendance_summary_${year}_${String(month).padStart(2, '0')}_${departmentName.replace(/\s+/g, '_')}.xlsx`,
  );
}

// ── Employee Detail Export ────────────────────────────────────────────────────
export async function exportEmployeeDetailExcel(
  employeeName: string,
  position: string,
  department: string,
  records: Array<{
    work_date: string;
    check_in_time?: string | null;
    check_out_time?: string | null;
    late?: number;
    early_leave?: number;
    overtime?: number;
    work_minutes?: number;
    status?: string;
  }>,
  leaveRequests: Array<{
    leave_type: string;
    start_date: string;
    end_date: string;
    leave_start_minutes?: number | null;
    leave_end_minutes?: number | null;
    status: string;
  }>,
  workPolicy: { break_start?: number | null; break_end?: number | null } | null,
  holidays: Array<{ holiday_date: string; name: string }>,
  month: number,
  year: number,
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'RMS Core';
  wb.created = new Date();

  const ws = wb.addWorksheet('Attendance Detail');
  const COL_COUNT = 8;

  const breakMins =
    workPolicy?.break_start != null && workPolicy?.break_end != null
      ? workPolicy.break_end - workPolicy.break_start
      : 0;

  const leaveMap = new Map<string, { type: string; partial: boolean; label: string }>();
  const approvedLeaves = leaveRequests.filter((lr) => lr.status === 'approved');
  for (const lr of approvedLeaves) {
    const [sy, sm, sd] = lr.start_date.slice(0, 10).split('-').map(Number);
    const [ey, em, ed] = lr.end_date.slice(0, 10).split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    const isPartial = lr.leave_start_minutes != null || lr.leave_end_minutes != null;
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const yy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yy}-${mm}-${dd}`;
      const typeLabel =
        lr.leave_type === 'annual'
          ? 'Annual Leave'
          : lr.leave_type === 'unpaid'
            ? 'Unpaid Leave'
            : lr.leave_type === 'sick'
              ? 'Sick Leave'
              : lr.leave_type === 'maternity'
                ? 'Maternity'
                : lr.leave_type === 'paternity'
                  ? 'Paternity'
                  : lr.leave_type;
      leaveMap.set(key, {
        type: lr.leave_type,
        partial: isPartial,
        label: isPartial ? `${typeLabel} (partial)` : typeLabel,
      });
    }
  }

  const recordMap = new Map<string, (typeof records)[0]>();
  for (const r of records) {
    const key = r.work_date?.slice(0, 10);
    if (key) recordMap.set(key, r);
  }

  // Generate all working days in month (Mon–Fri only)
  const allDays: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) {
      const mm = String(month).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      allDays.push(`${year}-${mm}-${dd}`);
    }
  }

  // Row fill colors per day type
  const FILL_ANNUAL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F5E9' },
  };
  const FILL_UNPAID: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF3E0' },
  };
  const FILL_SICK: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE3F2FD' },
  };
  const FILL_ABSENT: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFEBEE' },
  };
  const FILL_HOLIDAY: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF9C4' },
  };

  // Build holiday set
  const holidayMap = new Map<string, string>();
  for (const h of holidays) {
    holidayMap.set(h.holiday_date.slice(0, 10), h.name);
  }

  // ── Info block (2-column layout) ─────────────────────────────────────────
  // Row 1: Title
  ws.mergeCells(1, 1, 1, COL_COUNT);
  const titleCell = ws.getCell('A1');
  titleCell.value = 'ATTENDANCE DETAIL REPORT';
  titleCell.font = { bold: true, size: 13, color: { argb: 'FF4C3B8F' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 26;

  // Rows 2–4: 2-column info (left col: label+value, right col: label+value)
  const leftInfo = [
    ['Employee', employeeName],
    ['Position', position],
    ['Department', department],
  ];
  const rightInfo = [
    ['Period', `${String(month).padStart(2, '0')}/${year}`],
    ['Exported', formatDate(new Date().toISOString())],
    ['', ''],
  ];

  leftInfo.forEach(([label, value], i) => {
    const rowNum = i + 2;
    // Left: cols 1-2 label, 3-4 value
    ws.mergeCells(rowNum, 1, rowNum, 2);
    ws.mergeCells(rowNum, 3, rowNum, 4);
    const lc = ws.getCell(rowNum, 1);
    const vc = ws.getCell(rowNum, 3);
    lc.value = label;
    lc.font = { bold: true, size: 10, color: { argb: 'FF555555' } };
    vc.value = value;
    vc.font = { size: 10 };

    // Right: cols 5-6 label, 7-8 value
    const [rl, rv] = rightInfo[i];
    ws.mergeCells(rowNum, 5, rowNum, 6);
    ws.mergeCells(rowNum, 7, rowNum, COL_COUNT);
    const rlc = ws.getCell(rowNum, 5);
    const rvc = ws.getCell(rowNum, 7);
    rlc.value = rl;
    rlc.font = { bold: true, size: 10, color: { argb: 'FF555555' } };
    rvc.value = rv;
    rvc.font = { size: 10 };
    ws.getRow(rowNum).height = 16;
  });

  // Row 5: spacer
  ws.addRow([]);

  // ── Legend (above data table) ─────────────────────────────────────────────
  const legendItems = [
    { label: 'Annual Leave', fill: FILL_ANNUAL },
    { label: 'Sick / Maternity / Paternity', fill: FILL_SICK },
    { label: 'Unpaid Leave', fill: FILL_UNPAID },
    { label: 'Public Holiday', fill: FILL_HOLIDAY },
    { label: 'Absent (no record)', fill: FILL_ABSENT },
  ];

  // Legend title
  const legendTitleRow = ws.addRow(['Legend']);
  ws.mergeCells(legendTitleRow.number, 1, legendTitleRow.number, COL_COUNT);
  legendTitleRow.getCell(1).font = { bold: true, size: 9, color: { argb: 'FF555555' } };
  legendTitleRow.getCell(1).alignment = { horizontal: 'left' };
  legendTitleRow.height = 13;

  // 2-column legend: col1=color swatch, col2=label | col4=color swatch, col5=label
  const half = Math.ceil(legendItems.length / 2);
  for (let i = 0; i < half; i++) {
    const left = legendItems[i];
    const right = legendItems[i + half];
    const lr = ws.addRow([]);
    lr.height = 14;

    // Left item
    const swatchL = lr.getCell(1);
    swatchL.fill = left.fill;
    swatchL.border = BORDER;
    ws.mergeCells(lr.number, 2, lr.number, 3);
    const labelL = lr.getCell(2);
    labelL.value = left.label;
    labelL.font = { size: 9 };
    labelL.alignment = { vertical: 'middle' };

    // Right item
    if (right) {
      const swatchR = lr.getCell(5);
      swatchR.fill = right.fill;
      swatchR.border = BORDER;
      ws.mergeCells(lr.number, 6, lr.number, 7);
      const labelR = lr.getCell(6);
      labelR.value = right.label;
      labelR.font = { size: 9 };
      labelR.alignment = { vertical: 'middle' };
    }
  }

  ws.addRow([]);

  // ── Column headers ───────────────────────────────────────────────────────
  const headerRow = ws.addRow([
    'Date',
    'Check-in',
    'Check-out',
    'Work Time',
    'Late',
    'Early Leave',
    'Overtime',
    'Note',
  ]);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Data rows (all working days in month) ────────────────────────────────
  allDays.forEach((dateStr, i) => {
    const r = recordMap.get(dateStr);
    const leaveInfo = leaveMap.get(dateStr);
    const holidayName = holidayMap.get(dateStr);
    const hasCheckIn = !!r?.check_in_time;
    const [dy, dm, dd] = dateStr.split('-').map(Number);
    const dayDate = new Date(dy, dm - 1, dd);
    const isFuture = dayDate > today;
    const isAbsent = !hasCheckIn && !leaveInfo && !holidayName && !isFuture;

    const workTimeLabel = r?.work_minutes
      ? formatMinutes(r.work_minutes) + (breakMins > 0 ? `` : '')
      : holidayName
        ? 'Holiday'
        : leaveInfo
          ? leaveInfo.label
          : '—';

    const noteLabel = holidayName
      ? `${holidayName}`
      : leaveInfo
        ? leaveInfo.label
        : isAbsent
          ? 'Absent (no record)'
          : '';

    const dataRow = ws.addRow([
      dateStr,
      hasCheckIn ? fmtTime(r.check_in_time) : '—',
      r?.check_out_time ? fmtTime(r.check_out_time) : '—',
      workTimeLabel,
      formatMinutes(r?.late),
      formatMinutes(r?.early_leave),
      formatMinutes(r?.overtime),
      noteLabel,
    ]);
    dataRow.height = 17;

    let rowFill: ExcelJS.Fill | null = null;
    if (holidayName) rowFill = FILL_HOLIDAY;
    else if (leaveInfo?.type === 'annual') rowFill = FILL_ANNUAL;
    else if (leaveInfo?.type === 'unpaid') rowFill = FILL_UNPAID;
    else if (
      leaveInfo?.type === 'sick' ||
      leaveInfo?.type === 'maternity' ||
      leaveInfo?.type === 'paternity'
    )
      rowFill = FILL_SICK;
    else if (isAbsent) rowFill = FILL_ABSENT;
    else if (i % 2 === 1) rowFill = ALT_ROW_FILL;

    if (rowFill)
      dataRow.eachCell((cell) => {
        cell.fill = rowFill!;
      });
    applyBorder(dataRow, COL_COUNT);

    if ((r?.late ?? 0) > 0) dataRow.getCell(5).font = { color: { argb: 'FFE65100' } };
    const noteCell = dataRow.getCell(8);
    if (holidayName) noteCell.font = { color: { argb: 'FFF57F17' }, bold: true };
    else if (leaveInfo?.type === 'annual')
      noteCell.font = { color: { argb: 'FF2E7D32' }, italic: true };
    else if (leaveInfo?.type === 'unpaid')
      noteCell.font = { color: { argb: 'FFE65100' }, italic: true };
    else if (leaveInfo?.type === 'sick')
      noteCell.font = { color: { argb: 'FF1565C0' }, italic: true };
    else if (isAbsent) noteCell.font = { color: { argb: 'FFC62828' }, italic: true };

    dataRow.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
  });

  // ── Summary footer ───────────────────────────────────────────────────────
  ws.addRow([]);
  const totalRow = ws.addRow([
    'TOTAL',
    '',
    '',
    formatMinutes(records.reduce((s, r) => s + (r.work_minutes ?? 0), 0)),
    formatMinutes(records.reduce((s, r) => s + (r.late ?? 0), 0)),
    formatMinutes(records.reduce((s, r) => s + (r.early_leave ?? 0), 0)),
    formatMinutes(records.reduce((s, r) => s + (r.overtime ?? 0), 0)),
    `${records.filter((r) => r.check_in_time).length} / ${allDays.length} days`,
  ]);
  totalRow.height = 20;
  totalRow.eachCell((cell) => {
    cell.fill = SUBHEADER_FILL;
    cell.font = { bold: true, size: 10 };
    cell.border = BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // ── Column widths ────────────────────────────────────────────────────────
  ws.columns = [
    { width: 14 }, // Date
    { width: 12 }, // Check-in
    { width: 12 }, // Check-out
    { width: 16 }, // Work time
    { width: 10 }, // Late
    { width: 12 }, // Early leave
    { width: 12 }, // Overtime
    { width: 26 }, // Note
  ];

  ws.views = [{ state: 'frozen', ySplit: 10 }];

  await downloadWorkbook(
    wb,
    `attendance_${employeeName.replace(/\s+/g, '_')}_${year}_${String(month).padStart(2, '0')}.xlsx`,
  );
}

// ── Download helper ───────────────────────────────────────────────────────────
async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
