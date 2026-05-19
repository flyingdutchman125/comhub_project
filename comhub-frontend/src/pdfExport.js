import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Warna tema ComHub
const COLORS = {
  primary: [6, 182, 212],      // cyan-500
  dark: [15, 23, 42],          // slate-900
  darkBg: [2, 6, 23],          // slate-950
  muted: [100, 116, 139],      // slate-500
  white: [255, 255, 255],
  success: [16, 185, 129],     // emerald-500
  danger: [239, 68, 68],       // red-500
  amber: [245, 158, 11],       // amber-500
  blue: [59, 130, 246],        // blue-500
  purple: [168, 85, 247],      // purple-500
}

/**
 * Buat header PDF dengan branding ComHub
 */
function addHeader(doc, title, communityName, generatedAt) {
  const pageW = doc.internal.pageSize.getWidth()

  // Background header
  doc.setFillColor(...COLORS.dark)
  doc.rect(0, 0, pageW, 38, 'F')

  // Aksen garis cyan di atas
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageW, 3, 'F')

  // Logo kotak "C"
  doc.setFillColor(...COLORS.primary)
  doc.roundedRect(14, 9, 18, 18, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.dark)
  doc.text('C', 23, 21, { align: 'center' })

  // Teks ComHub
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.primary)
  doc.text('ComHub', 36, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.muted)
  doc.text('Community Dashboard', 36, 22)

  // Judul laporan (kanan)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.white)
  doc.text(title, pageW - 14, 16, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.muted)
  doc.text(communityName, pageW - 14, 22, { align: 'right' })
  doc.text('Digenerate: ' + generatedAt, pageW - 14, 28, { align: 'right' })

  // Garis pemisah
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.3)
  doc.line(14, 39, pageW - 14, 39)
}

/**
 * Tambahkan section title
 */
function addSectionTitle(doc, title, y) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLORS.primary)
  doc.text(title, 14, y)
  return y + 5
}

/**
 * Tambahkan stat card horizontal
 */
function addStatCards(doc, stats, y) {
  const pageW = doc.internal.pageSize.getWidth()
  const cardW = (pageW - 28 - (stats.length - 1) * 5) / stats.length
  let x = 14

  stats.forEach(stat => {
    // Card background
    doc.setFillColor(30, 41, 59) // slate-800
    doc.roundedRect(x, y, cardW, 20, 3, 3, 'F')

    // Border kiri berwarna
    doc.setFillColor(...stat.color)
    doc.roundedRect(x, y, 3, 20, 1, 1, 'F')

    // Label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.muted)
    doc.text(stat.label.toUpperCase(), x + 7, y + 7)

    // Value
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.white)
    doc.text(stat.value, x + 7, y + 15)

    x += cardW + 5
  })

  return y + 28
}

/**
 * Tambahkan footer di setiap halaman
 */
function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    doc.setFillColor(15, 23, 42)
    doc.rect(0, pageH - 12, pageW, 12, 'F')

    doc.setDrawColor(...COLORS.primary)
    doc.setLineWidth(0.2)
    doc.line(14, pageH - 12, pageW - 14, pageH - 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.muted)
    doc.text('© ComHub - Community Dashboard', 14, pageH - 5)
    doc.text(`Halaman ${i} / ${pageCount}`, pageW - 14, pageH - 5, { align: 'right' })
  }
}

/**
 * Style default tabel
 */
function defaultTableStyle(startY) {
  return {
    startY,
    margin: { left: 14, right: 14 },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      textColor: [226, 232, 240],
      fillColor: [15, 23, 42],
      lineColor: [30, 41, 59],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [6, 182, 212],
      textColor: [2, 6, 23],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [30, 41, 59],
    },
    tableLineColor: [30, 41, 59],
    tableLineWidth: 0.2,
  }
}

// ─────────────────────────────────────────────
// EKSPOR LAPORAN PROYEK
// ─────────────────────────────────────────────
export function exportProjectPDF(data) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const generatedAt = new Date(data.generated_at).toLocaleString('id-ID')
  const pageW = doc.internal.pageSize.getWidth()

  addHeader(doc, 'Laporan Project Tracking', data.community.name, generatedAt)

  let y = 48

  // Stat cards
  y = addSectionTitle(doc, 'Ringkasan', y)
  y = addStatCards(doc, [
    { label: 'Total Proyek', value: String(data.summary.totalProjects), color: COLORS.primary },
    { label: 'Total Anggaran', value: 'Rp ' + data.projects.reduce((s, p) => s + parseFloat(p.anggaran || 0), 0).toLocaleString('id-ID'), color: COLORS.blue },
    { label: 'Total Anggota', value: String(data.summary.totalMembers), color: COLORS.success },
  ], y)

  // Tabel proyek
  y = addSectionTitle(doc, 'Daftar Program Kerja', y)

  const getStatus = (progress) => {
    if (progress === 100) return 'Done'
    if (progress >= 50) return 'On Track'
    if (progress > 0) return 'At Risk'
    return 'Planning'
  }

  autoTable(doc, {
    ...defaultTableStyle(y),
    head: [['No', 'Nama Proyek', 'Deskripsi', 'Anggaran (Rp)', 'Progress', 'Status', 'Deadline']],
    body: data.projects.length > 0
      ? data.projects.map((p, i) => [
          i + 1,
          p.nama_proker || '-',
          p.deskripsi || '-',
          parseFloat(p.anggaran || 0).toLocaleString('id-ID'),
          `${p.progress || 0}%`,
          getStatus(p.progress || 0),
          p.end_date ? new Date(p.end_date).toLocaleDateString('id-ID') : '-'
        ])
      : [['', 'Belum ada proyek', '', '', '', '', '']],
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
    },
    didDrawCell: (hookData) => {
      // Warnai kolom status
      if (hookData.section === 'body' && hookData.column.index === 5) {
        const status = hookData.cell.raw
        let color = COLORS.muted
        if (status === 'Done' || status === 'On Track') color = COLORS.success
        else if (status === 'At Risk') color = COLORS.amber
        else if (status === 'Planning') color = COLORS.blue
        hookData.cell.styles.textColor = color
      }
    }
  })

  addFooter(doc)
  doc.save(`laporan-proyek-${data.community.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`)
}

// ─────────────────────────────────────────────
// EKSPOR LAPORAN KEUANGAN
// ─────────────────────────────────────────────
export function exportFinancialPDF(data) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const generatedAt = new Date(data.generated_at).toLocaleString('id-ID')

  addHeader(doc, 'Laporan Keuangan', data.community.name, generatedAt)

  let y = 48
  const fmt = (n) => 'Rp ' + parseFloat(n || 0).toLocaleString('id-ID')

  // Stat cards keuangan
  y = addSectionTitle(doc, 'Ringkasan Keuangan', y)
  y = addStatCards(doc, [
    { label: 'Total Pemasukan', value: fmt(data.summary.totalIncome), color: COLORS.success },
    { label: 'Total Pengeluaran', value: fmt(data.summary.totalExpense), color: COLORS.danger },
    { label: 'Saldo', value: fmt(data.summary.balance), color: data.summary.balance >= 0 ? COLORS.primary : COLORS.danger },
  ], y)

  // Tabel transaksi
  y = addSectionTitle(doc, 'Riwayat Transaksi', y)

  autoTable(doc, {
    ...defaultTableStyle(y),
    head: [['No', 'Tanggal', 'Tipe', 'Deskripsi', 'Jumlah (Rp)']],
    body: data.finances.length > 0
      ? data.finances.map((f, i) => [
          i + 1,
          f.transaction_date ? new Date(f.transaction_date).toLocaleDateString('id-ID') : '-',
          f.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
          f.description || '-',
          (f.type === 'INCOME' ? '+' : '-') + ' ' + parseFloat(f.amount || 0).toLocaleString('id-ID'),
        ])
      : [['', '-', 'Belum ada transaksi', '', '']],
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 26, halign: 'center' },
      4: { halign: 'right' },
    },
    didDrawCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 4) {
        const val = String(hookData.cell.raw)
        hookData.cell.styles.textColor = val.startsWith('+') ? COLORS.success : COLORS.danger
      }
      if (hookData.section === 'body' && hookData.column.index === 2) {
        const val = String(hookData.cell.raw)
        hookData.cell.styles.textColor = val === 'Pemasukan' ? COLORS.success : COLORS.danger
      }
    }
  })

  addFooter(doc)
  doc.save(`laporan-keuangan-${data.community.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`)
}

// ─────────────────────────────────────────────
// EKSPOR LAPORAN ANGGOTA
// ─────────────────────────────────────────────
export function exportMemberPDF(data) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const generatedAt = new Date(data.generated_at).toLocaleString('id-ID')

  addHeader(doc, 'Laporan Anggota', data.community.name, generatedAt)

  let y = 48

  // Hitung breakdown role
  const roleCounts = {}
  data.members.forEach(m => { roleCounts[m.community_role] = (roleCounts[m.community_role] || 0) + 1 })

  // Stat cards anggota
  y = addSectionTitle(doc, 'Ringkasan Keanggotaan', y)
  y = addStatCards(doc, [
    { label: 'Total Anggota', value: String(data.summary.totalMembers), color: COLORS.primary },
    { label: 'Pengurus Inti', value: String((roleCounts['KETUA'] || 0) + (roleCounts['SEKRETARIS'] || 0) + (roleCounts['BENDAHARA'] || 0)), color: COLORS.amber },
    { label: 'Total Proyek', value: String(data.summary.totalProjects), color: COLORS.purple },
  ], y)

  // Tabel anggota
  y = addSectionTitle(doc, 'Daftar Anggota Aktif', y)

  const getRoleColor = (role) => {
    if (role === 'KETUA') return COLORS.amber
    if (role === 'SEKRETARIS') return COLORS.blue
    if (role === 'BENDAHARA') return COLORS.success
    if (role === 'KADIV') return COLORS.purple
    return COLORS.muted
  }

  autoTable(doc, {
    ...defaultTableStyle(y),
    head: [['No', 'Nama', 'Email', 'Jabatan', 'Tanggal Bergabung']],
    body: data.members.length > 0
      ? data.members.map((m, i) => [
          i + 1,
          m.nama || '-',
          m.email || '-',
          m.community_role || '-',
          m.joined_at ? new Date(m.joined_at).toLocaleDateString('id-ID') : '-'
        ])
      : [['', 'Belum ada anggota', '', '', '']],
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
    },
    didDrawCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 3) {
        hookData.cell.styles.textColor = getRoleColor(String(hookData.cell.raw))
        hookData.cell.styles.fontStyle = 'bold'
      }
    }
  })

  addFooter(doc)
  doc.save(`laporan-anggota-${data.community.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`)
}
