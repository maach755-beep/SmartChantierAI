import type { GeneratedTable } from '../../../shared/plan-extraction/types.js';

export class TableExportService {
  toCsv(table: GeneratedTable): string {
    const headers = table.columns.map((c) => `"${c.replace(/"/g, '""')}"`).join(',');
    const rows = table.rows.map((row) =>
      table.columns.map((col) => `"${String(row[col] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    return '\ufeff' + [headers, ...rows].join('\n');
  }

  toPdfText(table: GeneratedTable, title: string): string {
    const lines = [
      title,
      new Date().toISOString(),
      '',
      table.name,
      table.columns.join(' | '),
      ...table.rows.map((r) => table.columns.map((c) => r[c]).join(' | ')),
    ];
    return lines.join('\n');
  }

  toExcelXml(table: GeneratedTable): string {
    const rows = table.rows
      .map(
        (r) =>
          `<Row>${table.columns.map((c) => `<Cell><Data>${escapeXml(String(r[c] ?? ''))}</Data></Cell>`).join('')}</Row>`
      )
      .join('');
    return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${escapeXml(table.name)}">
<Table>
<Row>${table.columns.map((c) => `<Cell><Data>${escapeXml(c)}</Data></Cell>`).join('')}</Row>
${rows}
</Table></Worksheet></Workbook>`;
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
