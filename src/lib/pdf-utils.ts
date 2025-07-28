import jsPDF from 'jspdf'

// Türkçe karakter desteği için gelişmiş mapping
const turkishCharMap: { [key: string]: string } = {
  'ç': 'c', 'Ç': 'C',
  'ğ': 'g', 'Ğ': 'G',
  'ı': 'i', 'İ': 'I',
  'ö': 'o', 'Ö': 'O',
  'ş': 's', 'Ş': 'S',
  'ü': 'u', 'Ü': 'U'
}

// Türkçe metinleri ASCII'ye güvenli şekilde dönüştür
export function formatTurkishText(text: string): string {
  if (!text) return ''
  
  // Türkçe karakterleri değiştir
  return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (match) => {
    return turkishCharMap[match] || match
  })
}

// PDF'yi Türkçe içerik için ayarla
export function setupTurkishPDF(doc: jsPDF) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  
  // PDF özelliklerini ayarla
  doc.setProperties({
    title: 'Proje Raporu',
    subject: 'TEMSA Proje Yonetim Sistemi',
    creator: 'TEMSA',
    author: 'TEMSA',
    keywords: 'proje, rapor, TEMSA'
  })
}

// Basit ve temiz header tasarımı
export function addProfessionalHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Üst kısım arka plan
  doc.setFillColor(245, 245, 245)
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  // Alt çizgi
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(0, 40, pageWidth, 40)
  
  // TEMSA logosu/ismi
  doc.setTextColor(0, 100, 200)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TEMSA', 15, 20)
  
  // Başlık - ortalanmış
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  const titleText = formatTurkishText(title)
  doc.text(titleText, pageWidth / 2, 20, { align: 'center' })
  
  // Alt başlık varsa
  if (subtitle) {
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const subtitleText = formatTurkishText(subtitle)
    doc.text(subtitleText, pageWidth / 2, 30, { align: 'center' })
  }
  
  // Tarih - sağ üst
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const currentDate = new Date().toLocaleDateString('tr-TR')
  doc.text(currentDate, pageWidth - 15, 20, { align: 'right' })
  
  return 50 // Content başlangıç pozisyonu
}

// Basit footer
export function addProfessionalFooter(doc: jsPDF, pageNumber?: number, totalPages?: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Alt çizgi
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20)
  
  // Footer yazısı
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('TEMSA Proje Yonetim Sistemi', 15, pageHeight - 10)
  
  // Sayfa numarası
  if (pageNumber) {
    const pageText = totalPages ? `${pageNumber} / ${totalPages}` : pageNumber.toString()
    doc.text(`Sayfa ${pageText}`, pageWidth - 15, pageHeight - 10, { align: 'right' })
  }
}

// Basit bölüm başlığı
export function addSectionHeader(doc: jsPDF, title: string, y: number): number {
  // Arka plan
  doc.setFillColor(240, 240, 240)
  doc.rect(15, y - 2, doc.internal.pageSize.getWidth() - 30, 18, 'F')
  
  // Başlık
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  const titleText = formatTurkishText(title)
  doc.text(titleText, 20, y + 10)
  
  return y + 25
}

// Basit tablo tasarımı
export function addSimpleTable(
  doc: jsPDF, 
  headers: string[], 
  rows: string[][], 
  startY: number,
  options?: {
    columnWidths?: number[]
    fontSize?: number
  }
): number {
  const { columnWidths, fontSize = 9 } = options || {}
  const pageWidth = doc.internal.pageSize.getWidth()
  const tableWidth = pageWidth - 30
  const colCount = headers.length
  const defaultColWidth = tableWidth / colCount
  const widths = columnWidths || new Array(colCount).fill(defaultColWidth)
  const rowHeight = 12
  
  let currentY = startY
  
  // Tablo başlıkları
  doc.setFillColor(230, 230, 230)
  doc.rect(15, currentY, tableWidth, rowHeight + 4, 'F')
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(fontSize)
  doc.setFont('helvetica', 'bold')
  
  let currentX = 15
  headers.forEach((header, index) => {
    const headerText = formatTurkishText(header)
    doc.text(headerText, currentX + 5, currentY + 8)
    currentX += widths[index]
  })
  
  currentY += rowHeight + 4
  
  // Tablo satırları
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)
  
  rows.forEach((row, rowIndex) => {
    // Zebra şerit
    if (rowIndex % 2 === 1) {
      doc.setFillColor(250, 250, 250)
      doc.rect(15, currentY, tableWidth, rowHeight, 'F')
    }
    
    currentX = 15
    row.forEach((cell, colIndex) => {
      const cellText = formatTurkishText(cell || '')
      // Uzun metinleri kırp
      const maxChars = Math.floor(widths[colIndex] / 4)
      const displayText = cellText.length > maxChars ? 
        cellText.substring(0, maxChars - 3) + '...' : cellText
      
      doc.text(displayText, currentX + 5, currentY + 8)
      currentX += widths[colIndex]
    })
    
    currentY += rowHeight
  })
  
  // Tablo çerçevesi
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.rect(15, startY, tableWidth, currentY - startY, 'D')
  
  return currentY + 10
}

// Basit istatistik kutuları
export function addStatsBox(
  doc: jsPDF, 
  stats: Array<{ label: string; value: string; color?: readonly [number, number, number] }>, 
  startY: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const boxWidth = (pageWidth - 60) / stats.length
  let currentX = 15
  
  stats.forEach((stat) => {
    // Kutu arka planı
    doc.setFillColor(250, 250, 250)
    doc.setDrawColor(200, 200, 200)
    doc.rect(currentX, startY, boxWidth, 35, 'FD')
    
    // Değer
    doc.setTextColor(0, 100, 200)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    const valueText = formatTurkishText(stat.value)
    doc.text(valueText, currentX + boxWidth / 2, startY + 15, { align: 'center' })
    
    // Etiket
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const labelText = formatTurkishText(stat.label)
    doc.text(labelText, currentX + boxWidth / 2, startY + 28, { align: 'center' })
    
    currentX += boxWidth + 10
  })
  
  return startY + 45
}

// Sayfa sonu kontrolü
export function checkPageBreak(doc: jsPDF, currentY: number, requiredHeight: number): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (currentY + requiredHeight > pageHeight - 30) {
    doc.addPage()
    return 50 // Yeni sayfanın başı
  }
  return currentY
}

// Basit metin ekleme fonksiyonu
export function addTurkishText(
  doc: jsPDF, 
  text: string, 
  x: number, 
  y: number, 
  options?: {
    align?: 'left' | 'center' | 'right'
    maxWidth?: number
    fontSize?: number
    fontStyle?: 'normal' | 'bold' | 'italic'
  }
) {
  const { align = 'left', maxWidth, fontSize, fontStyle = 'normal' } = options || {}
  
  if (!text) return
  
  if (fontSize) {
    doc.setFontSize(fontSize)
  }
  
  doc.setFont('helvetica', fontStyle)
  
  // Türkçe karakterleri değiştir
  const formattedText = formatTurkishText(text)
  
  try {
    if (maxWidth) {
      const lines = doc.splitTextToSize(formattedText, maxWidth)
      if (Array.isArray(lines)) {
        lines.forEach((line: string, index: number) => {
          doc.text(line, x, y + (index * 12), { align })
        })
      } else {
        doc.text(lines, x, y, { align })
      }
    } else {
      doc.text(formattedText, x, y, { align })
    }
  } catch (error) {
    console.warn('Text rendering error:', error)
    // Basit fallback
    doc.text(formattedText, x, y, { align })
  }
}

// Professional color palette for modern design
export const PDF_COLORS = {
  primary: [13, 110, 253] as const,      // Bootstrap blue
  secondary: [108, 117, 125] as const,   // Muted gray
  success: [25, 135, 84] as const,       // Success green
  warning: [255, 193, 7] as const,       // Warning yellow
  danger: [220, 53, 69] as const,        // Danger red
  info: [13, 202, 240] as const,         // Info cyan
  text: [33, 37, 41] as const,           // Dark text
  textMuted: [108, 117, 125] as const,   // Muted text
  background: [248, 249, 250] as const,  // Light background
  white: [255, 255, 255] as const,
  border: [220, 225, 230] as const       // Border gray
}

// Enhanced status color mapping with modern colors
export function getStatusColor(status: string): [number, number, number] {
  const statusColors: { [key: string]: [number, number, number] } = {
    'PLANNING': [255, 193, 7],       // Warning yellow
    'IN_PROGRESS': [13, 110, 253],   // Primary blue
    'COMPLETED': [25, 135, 84],      // Success green
    'ON_HOLD': [108, 117, 125],      // Muted gray
    'TODO': [108, 117, 125],         // Muted gray
    'REVIEW': [102, 16, 242],        // Purple
    'BLOCKED': [220, 53, 69],        // Danger red
    'CANCELLED': [220, 53, 69]       // Danger red
  }
  return statusColors[status.toUpperCase()] || PDF_COLORS.textMuted
}

// Comprehensive Turkish status text mapping
export function getStatusText(status: string): string {
  const statusTexts: { [key: string]: string } = {
    'PLANNING': 'Planlanıyor',
    'IN_PROGRESS': 'Devam Ediyor',
    'COMPLETED': 'Tamamlandı',
    'ON_HOLD': 'Beklemede',
    'TODO': 'Yapılacak',
    'REVIEW': 'İncelemede',
    'BLOCKED': 'Engellenmiş',
    'CANCELLED': 'İptal Edilmiş',
    'ACTIVE': 'Aktif',
    'INACTIVE': 'Pasif'
  }
  return statusTexts[status.toUpperCase()] || formatTurkishText(status)
}

// Enhanced priority color mapping
export function getPriorityColor(priority: string): [number, number, number] {
  const priorityColors: { [key: string]: [number, number, number] } = {
    'URGENT': [220, 53, 69],     // Red
    'HIGH': [255, 193, 7],       // Orange/Yellow
    'MEDIUM': [13, 110, 253],    // Blue
    'LOW': [25, 135, 84],        // Green
    'CRITICAL': [220, 53, 69]    // Red
  }
  return priorityColors[priority.toUpperCase()] || PDF_COLORS.textMuted
}

// Comprehensive Turkish priority text mapping
export function getPriorityText(priority: string): string {
  const priorityTexts: { [key: string]: string } = {
    'URGENT': 'Acil',
    'HIGH': 'Yüksek',
    'MEDIUM': 'Orta', 
    'LOW': 'Düşük',
    'CRITICAL': 'Kritik'
  }
  return priorityTexts[priority.toUpperCase()] || formatTurkishText(priority)
}

// Add a professional information box
export function addInfoBox(
  doc: jsPDF,
  title: string,
  content: string,
  x: number,
  y: number,
  width: number,
  color: readonly [number, number, number] = PDF_COLORS.primary
): number {
  const boxHeight = 60
  
  // Box background
  doc.setFillColor(255, 255, 255)
  doc.rect(x, y, width, boxHeight, 'F')
  
  // Colored left border
  doc.setFillColor(color[0], color[1], color[2])
  doc.rect(x, y, 4, boxHeight, 'F')
  
  // Box border
  doc.setDrawColor(220, 225, 230)
  doc.setLineWidth(0.5)
  doc.rect(x, y, width, boxHeight, 'D')
  
  // Title
  doc.setTextColor(33, 37, 41)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  addTurkishText(doc, formatTurkishText(title), x + 15, y + 18)
  
  // Content
  doc.setTextColor(108, 117, 125)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  addTurkishText(doc, formatTurkishText(content), x + 15, y + 35, {
    maxWidth: width - 25
  })
  
  return y + boxHeight + 10
}

// Add a modern progress bar
export function addProgressBar(
  doc: jsPDF,
  label: string,
  percentage: number,
  x: number,
  y: number,
  width: number
): number {
  const barHeight = 8
  const labelHeight = 15
  
  // Label
  doc.setTextColor(33, 37, 41)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  addTurkishText(doc, formatTurkishText(label), x, y + 10)
  
  // Percentage text
  doc.setTextColor(108, 117, 125)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  addTurkishText(doc, `%${percentage}`, x + width, y + 10, { align: 'right' })
  
  // Progress bar background
  doc.setFillColor(233, 236, 239)
  doc.rect(x, y + labelHeight, width, barHeight, 'F')
  
  // Progress bar fill
  const fillWidth = (width * percentage) / 100
  let barColor: readonly [number, number, number] = PDF_COLORS.success
  if (percentage < 30) barColor = PDF_COLORS.danger
  else if (percentage < 70) barColor = PDF_COLORS.warning
  
  doc.setFillColor(barColor[0], barColor[1], barColor[2])
  doc.rect(x, y + labelHeight, fillWidth, barHeight, 'F')
  
  // Progress bar border
  doc.setDrawColor(220, 225, 230)
  doc.setLineWidth(0.5)
  doc.rect(x, y + labelHeight, width, barHeight, 'D')
  
  return y + labelHeight + barHeight + 15
}
