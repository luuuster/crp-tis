/**
 * Export CSV sem dependência. `toCsv` é puro (testável); `exportCsv` dispara o download no browser.
 * Separador `;` (padrão do Excel pt-BR) e BOM UTF-8 para acentos abrirem corretos no Excel.
 */
export type CsvColumn<T> = { header: string; value: (row: T) => string | number | null | undefined }

function escapeCell(v: string | number | null | undefined, sep: string): string {
  const s = v == null ? '' : String(v)
  return s.includes(sep) || s.includes('"') || s.includes('\n') || s.includes('\r') ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[], sep = ';'): string {
  const head = columns.map((c) => escapeCell(c.header, sep)).join(sep)
  const body = rows.map((r) => columns.map((c) => escapeCell(c.value(r), sep)).join(sep)).join('\r\n')
  return body ? `${head}\r\n${body}` : head
}

export function exportCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const csv = '﻿' + toCsv(rows, columns) // BOM UTF-8 (acentos no Excel)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
