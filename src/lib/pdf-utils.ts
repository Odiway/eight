import jsPDF from 'jspdf'

// Enhanced Turkish character mapping with proper Unicode support
const turkishCharMap: { [key: string]: string } = {
  'ç': '\u00E7',
  'Ç': '\u00C7',
  'ğ': '\u011F',
  'Ğ': '\u011E',
  'ı': '\u0131',
  'İ': '\u0130',
  'ö': '\u00F6',
  'Ö': '\u00D6',
  'ş': '\u015F',
  'Ş': '\u015E',
  'ü': '\u00FC',
  'Ü': '\u00DC'
}

// Function to handle Turkish characters with proper encoding
export function formatTurkishText(text: string): string {
  if (!text) return ''
  
  // Ensure proper UTF-8 encoding for Turkish characters
  return text.normalize('NFC')
}

// Professional PDF setup with Turkish language support
export function setupTurkishPDF(doc: jsPDF) {
  // Use standard fonts with UTF-8 support
  doc.setFont('helvetica', 'normal')
  
  // Set document properties for Turkish content
  doc.setProperties({
    title: 'Proje Raporu',
    subject: 'TEMSA Proje Yönetim Sistemi',
    creator: 'TEMSA',
    author: 'TEMSA Proje Yönetim Sistemi',
    keywords: 'proje, rapor, TEMSA',
    language: 'tr-TR'
  })
  
  // Set initial document settings
  doc.setFontSize(10)
  doc.setTextColor(33, 37, 41) // Professional dark gray
}

// Modern professional PDF header with clean design
export function addProfessionalHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Clean minimal header background
  doc.setFillColor(248, 249, 250)
  doc.rect(0, 0, pageWidth, 50, 'F')
  
  // Subtle bottom border
  doc.setDrawColor(220, 225, 230)
  doc.setLineWidth(0.5)
  doc.line(0, 50, pageWidth, 50)
  
  // Company branding - minimal and elegant
  doc.setTextColor(13, 110, 253) // Professional blue
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  addTurkishText(doc, 'TEMSA', 25, 22)
  
  // Report title - centered and prominent
  doc.setTextColor(33, 37, 41) // Professional dark
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  addTurkishText(doc, formatTurkishText(title), pageWidth / 2, 25, { align: 'center' })
  
  // Subtitle - lighter and smaller
  if (subtitle) {
    doc.setTextColor(108, 117, 125) // Muted gray
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    addTurkishText(doc, formatTurkishText(subtitle), pageWidth / 2, 37, { align: 'center' })
  }
  
  // Date stamp - right aligned
  doc.setTextColor(108, 117, 125)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const currentDate = new Date().toLocaleDateString('tr-TR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Europe/Istanbul'
  })
  addTurkishText(doc, formatTurkishText(currentDate), pageWidth - 25, 22, { align: 'right' })
  
  return 65 // Return Y position for content start
}

// Clean professional footer
export function addProfessionalFooter(doc: jsPDF, pageNumber?: number, totalPages?: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Subtle footer separator
  doc.setDrawColor(220, 225, 230)
  doc.setLineWidth(0.3)
  doc.line(25, pageHeight - 25, pageWidth - 25, pageHeight - 25)
  
  // Footer content
  doc.setTextColor(108, 117, 125)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  addTurkishText(doc, 'TEMSA Proje Yönetim Sistemi', 25, pageHeight - 15)
  
  // Page number - right aligned
  if (pageNumber) {
    const pageText = totalPages ? `${pageNumber} / ${totalPages}` : pageNumber.toString()
    addTurkishText(doc, `Sayfa ${pageText}`, pageWidth - 25, pageHeight - 15, { align: 'right' })
  }
}

// Clean section headers with consistent styling
export function addSectionHeader(doc: jsPDF, title: string, y: number): number {
  // Light background for section
  doc.setFillColor(248, 249, 250)
  doc.rect(25, y - 3, doc.internal.pageSize.getWidth() - 50, 22, 'F')
  
  // Section title
  doc.setTextColor(33, 37, 41)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  addTurkishText(doc, formatTurkishText(title), 30, y + 11)
  
  // Accent line under title
  doc.setDrawColor(13, 110, 253)
  doc.setLineWidth(2)
  doc.line(30, y + 16, 80, y + 16)
  
  return y + 30
}

// Modern table design with proper Turkish text support
export function addSimpleTable(
  doc: jsPDF, 
  headers: string[], 
  rows: string[][], 
  startY: number,
  options?: {
    columnWidths?: number[]
    headerBg?: [number, number, number]
    rowHeight?: number
    fontSize?: number
  }
): number {
  const { columnWidths, headerBg = [248, 249, 250], rowHeight = 14, fontSize = 9 } = options || {}
  const pageWidth = doc.internal.pageSize.getWidth()
  const tableWidth = pageWidth - 50
  const colCount = headers.length
  const defaultColWidth = tableWidth / colCount
  const widths = columnWidths || new Array(colCount).fill(defaultColWidth)
  
  let currentY = startY
  
  // Table headers with clean styling
  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2])
  doc.rect(25, currentY, tableWidth, rowHeight + 6, 'F')
  
  // Header border
  doc.setDrawColor(220, 225, 230)
  doc.setLineWidth(0.5)
  doc.rect(25, currentY, tableWidth, rowHeight + 6, 'D')
  
  doc.setTextColor(33, 37, 41)
  doc.setFontSize(fontSize)
  doc.setFont('helvetica', 'bold')
  
  let currentX = 25
  headers.forEach((header, index) => {
    addTurkishText(doc, formatTurkishText(header), currentX + 8, currentY + 10)
    currentX += widths[index]
  })
  
  currentY += rowHeight + 6
  
  // Table rows with alternating backgrounds
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(33, 37, 41)
  
  rows.forEach((row, rowIndex) => {
    // Subtle alternating row background
    if (rowIndex % 2 === 1) {
      doc.setFillColor(252, 253, 253)
      doc.rect(25, currentY, tableWidth, rowHeight + 4, 'F')
    }
    
    currentX = 25
    row.forEach((cell, colIndex) => {
      const cellText = formatTurkishText(cell || '')
      addTurkishText(doc, cellText, currentX + 8, currentY + 10, { 
        maxWidth: widths[colIndex] - 16 
      })
      currentX += widths[colIndex]
    })
    
    // Row separator
    doc.setDrawColor(245, 245, 245)
    doc.setLineWidth(0.3)
    doc.line(25, currentY + rowHeight + 4, 25 + tableWidth, currentY + rowHeight + 4)
    
    currentY += rowHeight + 4
  })
  
  // Final table border
  doc.setDrawColor(220, 225, 230)
  doc.setLineWidth(0.5)
  doc.rect(25, startY, tableWidth, currentY - startY, 'D')
  
  return currentY + 15
}

// Modern statistics display with card-like design
export function addStatsBox(
  doc: jsPDF, 
  stats: Array<{ label: string; value: string; color?: [number, number, number] }>, 
  startY: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const boxWidth = (pageWidth - 80) / stats.length
  let currentX = 25
  
  stats.forEach((stat, index) => {
    // Modern card background with subtle shadow effect
    doc.setFillColor(255, 255, 255)
    doc.rect(currentX, startY, boxWidth, 45, 'F')
    
    // Card border
    doc.setDrawColor(220, 225, 230)
    doc.setLineWidth(0.5)
    doc.rect(currentX, startY, boxWidth, 45, 'D')
    
    // Value with colored accent
    const color = stat.color || [13, 110, 253]
    doc.setTextColor(color[0], color[1], color[2])
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    addTurkishText(doc, formatTurkishText(stat.value), currentX + boxWidth / 2, startY + 20, { align: 'center' })
    
    // Label with proper Turkish support
    doc.setTextColor(108, 117, 125)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    addTurkishText(doc, formatTurkishText(stat.label), currentX + boxWidth / 2, startY + 35, { 
      align: 'center',
      maxWidth: boxWidth - 10
    })
    
    currentX += boxWidth + 15
  })
  
  return startY + 60
}

// Check if new page is needed
export function checkPageBreak(doc: jsPDF, currentY: number, requiredHeight: number): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (currentY + requiredHeight > pageHeight - 30) {
    doc.addPage()
    return 20 // Return to top of new page
  }
  return currentY
}

// Enhanced Turkish text rendering with proper Unicode support
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
  
  // Ensure proper text formatting
  const formattedText = formatTurkishText(text)
  
  try {
    if (maxWidth) {
      // Handle text wrapping with proper line height
      const lines = doc.splitTextToSize(formattedText, maxWidth)
      const lineHeight = fontSize ? fontSize * 1.2 : 12
      
      if (Array.isArray(lines)) {
        lines.forEach((line: string, index: number) => {
          doc.text(line, x, y + (index * lineHeight), { align })
        })
      } else {
        doc.text(lines, x, y, { align })
      }
    } else {
      // Direct text rendering
      doc.text(formattedText, x, y, { align })
    }
  } catch (error) {
    console.warn('Turkish text rendering error, using ASCII fallback:', error)
    
    // Enhanced fallback with better character replacement
    const fallbackText = formattedText.replace(/[çÇğĞıİöÖşŞüÜ]/g, (match) => {
      const replacements: { [key: string]: string } = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G', 
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
      }
      return replacements[match] || match
    })
    
    if (maxWidth) {
      const lines = doc.splitTextToSize(fallbackText, maxWidth)
      const lineHeight = fontSize ? fontSize * 1.2 : 12
      
      if (Array.isArray(lines)) {
        lines.forEach((line: string, index: number) => {
          doc.text(line, x, y + (index * lineHeight), { align })
        })
      } else {
        doc.text(lines, x, y, { align })
      }
    } else {
      doc.text(fallbackText, x, y, { align })
    }
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
