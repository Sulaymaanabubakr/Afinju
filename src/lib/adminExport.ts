import { format } from 'date-fns'

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'doc' | 'png' | 'jpg'

type DatasetExportArgs = {
  fileBase: string
  title: string
  headers: string[]
  rows: Array<Array<string | number>>
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildTableHtml(title: string, headers: string[], rows: Array<Array<string | number>>): string {
  const headerHtml = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')
  const rowHtml = rows
    .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
    .join('')

  return `
    <style>
      .export-wrap{font-family:Arial,sans-serif;padding:24px;color:#111}
      h1{font-size:20px;margin:0 0 12px}
      p{font-size:12px;color:#555;margin:0 0 14px}
      table{border-collapse:collapse;width:100%;font-size:11px}
      th,td{border:1px solid #d8d8d8;padding:6px 8px;text-align:left;vertical-align:top}
      th{background:#f3f3f3;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
      tr:nth-child(even) td{background:#fafafa}
    </style>
    <div class="export-wrap">
      <h1>${escapeHtml(title)}</h1>
      <p>Generated ${format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
      <table>
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowHtml}</tbody>
      </table>
    </div>
  `
}

export async function exportDatasetAs(formatType: ExportFormat, args: DatasetExportArgs): Promise<void> {
  const { fileBase, title, headers, rows } = args
  const tableHtml = buildTableHtml(title, headers, rows)

  if (formatType === 'csv') {
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileBase}.csv`
    a.click()
    URL.revokeObjectURL(url)
    return
  }

  if (formatType === 'excel') {
    const XLSX = await import('xlsx')
    const data = rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])))
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export')
    XLSX.writeFile(workbook, `${fileBase}.xlsx`)
    return
  }

  if (formatType === 'pdf') {
    const jsPDFMod = await import('jspdf')
    const autoTableMod = await import('jspdf-autotable')
    const jsPDF = jsPDFMod.default
    const autoTable = (autoTableMod as any).default || autoTableMod
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text(title, 14, 14)
    doc.setFontSize(9)
    doc.text(`Generated ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 20)
    autoTable(doc, {
      startY: 24,
      head: [headers],
      body: rows,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [20, 20, 20] },
    })
    doc.save(`${fileBase}.pdf`)
    return
  }

  if (formatType === 'doc') {
    const blob = new Blob([`<html><body>${tableHtml}</body></html>`], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileBase}.doc`
    a.click()
    URL.revokeObjectURL(url)
    return
  }

  const html2canvas = (await import('html2canvas')).default
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-99999px'
  container.style.top = '0'
  container.style.width = '1800px'
  container.style.background = '#fff'
  container.innerHTML = tableHtml
  document.body.appendChild(container)
  const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' })
  document.body.removeChild(container)

  const mime = formatType === 'png' ? 'image/png' : 'image/jpeg'
  const ext = formatType === 'png' ? 'png' : 'jpg'
  const link = document.createElement('a')
  link.href = canvas.toDataURL(mime, 0.95)
  link.download = `${fileBase}.${ext}`
  link.click()
}

