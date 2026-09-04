import { api } from '../lib/api'
import { toast } from '../lib/notify'
import type { PdfSection } from '../types/crm'

export const COMPANY_NAME = 'WaveContainers'

const PDF_NAVY: [number, number, number] = [22, 38, 92]
const PDF_TEAL: [number, number, number] = [42, 168, 168]
const PDF_BLUE: [number, number, number] = [37, 99, 201]
const PDF_STRIPE: [number, number, number] = [239, 244, 251]
const PDF_GREY: [number, number, number] = [107, 114, 128]
const PDF_BORDER: [number, number, number] = [217, 225, 236]

const PDF_LABELS: Record<string, string> = {
  co: 'Company', ref: 'Reference', pic: 'PIC', qty: 'Qty',
  buyPU: 'Buy / Unit', sellPU: 'Sell / Unit',
  totalBuy: 'Total Buy', totalSell: 'Total Sell',
  emailAddr: 'Email', neededBy: 'Needed By', prevStatus: 'Previous Status',
  currStatus: 'Current Status', altSize: 'Alt. Size', altCondition: 'Alt. Condition',
  altQuantity: 'Alt. Quantity', altAskingPrice: 'Alt. Asking Price', altNotes: 'Alt. Notes',
  rejectionReason: 'Rejection Reason', contactMissing: 'Contact Missing',
}

export const humanizeKey = (key: string) => PDF_LABELS[key] ?? key
  .replace(/[-_]/g, ' ')
  .replace(/([a-z\d])([A-Z])/g, '$1 $2')
  .replace(/\b\w/g, c => c.toUpperCase())

export const isInternalKey = (key: string) => key === 'id' || /Id$/.test(key)

export const exportToExcel = async (data: any[], filename: string) => {
  if (!data || !data.length) return toast('There is nothing to export.', 'error')
  try {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Export')
    XLSX.writeFile(wb, `${filename}.xlsx`)
  } catch {
    toast('Could not build the Excel file.', 'error')
  }
}

export const exportToGoogleSheet = async (data: any[], filename: string) => {
  if (!data || !data.length) return toast('There is nothing to export.', 'error')
  toast('Creating your Google Sheet…', 'info')
  try {
    const res = await api.post('/export/google-sheet', { title: filename, rows: data })
    const url = res.data.data?.url
    if (url) {
      window.open(url, '_blank', 'noopener')
      toast(`Sheet created with ${res.data.data.rowCount} rows.`, 'success')
    }
  } catch (e: any) {
    toast(e.response?.data?.error?.message ?? 'Google Sheets export failed.', 'error')
  }
}

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = ('' + (val || '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const downloadPdfDocument = async (opts: {
  title: string; scope?: string; filename: string; sections: PdfSection[];
}) => {
  const sections = opts.sections.filter(s => s.rows.length > 0)
  if (!sections.length) return toast('There is nothing to export.', 'error')

  try {
    const [{ jsPDF }, autoTableMod] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ])
    const autoTable = (autoTableMod as any).default ?? (autoTableMod as any).autoTable
    if (typeof autoTable !== 'function') {
      throw new Error('the autoTable plugin did not load')
    }

    const widest = Math.max(...sections.map(s => Object.keys(s.rows[0]).filter(k => !isInternalKey(k)).length))
    const doc = new jsPDF({ orientation: widest > 6 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' })

    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 36
    const headerH = 92

    const totalRecords = sections.reduce((n, s) => n + s.rows.length, 0)
    const generated = new Date().toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })

    const drawPageFurniture = () => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...PDF_NAVY)
      doc.text(opts.title, margin, margin + 14)

      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...PDF_BLUE)
      doc.text(`${COMPANY_NAME}${opts.scope ? ` | ${opts.scope}` : ''}`, margin, margin + 30)

      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...PDF_GREY)
      doc.text(`Generated: ${generated}  |  Records: ${totalRecords}`, margin, margin + 44)

      doc.setFontSize(13); doc.setFont('helvetica', 'bold')
      const rest = 'Containers'
      const restW = doc.getTextWidth(rest)
      doc.setTextColor(...PDF_NAVY); doc.text(rest, pageW - margin - restW, margin + 14)
      doc.setTextColor(...PDF_TEAL); doc.text('Wave', pageW - margin - restW - doc.getTextWidth('Wave'), margin + 14)

      doc.setDrawColor(...PDF_TEAL); doc.setLineWidth(1.4)
      doc.line(margin, margin + 54, pageW - margin, margin + 54)

      const page = doc.getNumberOfPages()
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...PDF_GREY)
      doc.text(`${COMPANY_NAME} · Container CRM`, margin, pageH - 20)
      const pageLabel = `Page ${page}`
      doc.text(pageLabel, pageW - margin - doc.getTextWidth(pageLabel), pageH - 20)
    }

    let cursorY = headerH

    sections.forEach((section, index) => {
      const headers = Object.keys(section.rows[0]).filter(k => !isInternalKey(k))

      if (section.title) {
        if (cursorY > pageH - 120) { doc.addPage(); cursorY = headerH }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...PDF_NAVY)
        doc.text(section.title, margin, cursorY)
        cursorY += 10
      } else if (index > 0) {
        cursorY += 6
      }

      autoTable(doc, {
        startY: cursorY,
        margin: { left: margin, right: margin, top: headerH, bottom: 34 },
        head: [headers.map(humanizeKey)],
        body: section.rows.map(row => headers.map(h => {
          const v = row[h]
          return v === null || v === undefined || v === '' ? '—' : String(v)
        })),
        theme: 'grid',
        styles: {
          font: 'helvetica', fontSize: 7.5, cellPadding: 5,
          lineColor: PDF_BORDER, lineWidth: 0.5,
          textColor: [17, 24, 39], overflow: 'linebreak', valign: 'middle',
        },
        headStyles: {
          fillColor: PDF_NAVY, textColor: [255, 255, 255],
          fontStyle: 'bold', fontSize: 7.5, cellPadding: 6,
        },
        alternateRowStyles: { fillColor: PDF_STRIPE },
        didDrawPage: drawPageFurniture,
      })

      cursorY = (doc as any).lastAutoTable.finalY + 18
    })

    doc.save(`${opts.filename}.pdf`)
  } catch (err: any) {
    console.error('[PDF export] failed:', err)
    toast(`Could not build the PDF: ${err?.message ?? 'unknown error'}`, 'error')
  }
}

export const titleCase = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export const exportToPDF = (data: any[], filename: string) => {
  if (!data || !data.length) return toast('There is nothing to export.', 'error')
  void downloadPdfDocument({
    title: `${titleCase(filename)} Report`.toUpperCase(),
    scope: 'Container CRM',
    filename,
    sections: [{ rows: data }],
  })
}
