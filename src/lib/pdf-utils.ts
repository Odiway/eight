import jsPDF from 'jspdf'

// Turkish character mapping for fallback
const turkishCharMap: { [key: string]: string } = {
  'ç': 'c',
  'Ç': 'C',
  'ğ': 'g',
  'Ğ': 'G',
  'ı': 'i',
  'İ': 'I',
  'ö': 'o',
  'Ö': 'O',
  'ş': 's',
  'Ş': 'S',
  'ü': 'u',
  'Ü': 'U'
}

// Function to handle Turkish characters
export function formatTurkishText(text: string): string {
  // First try to preserve Turkish characters
  return text
}

// Function to setup PDF with proper font and encoding
export function setupTurkishPDF(doc: jsPDF) {
  // Set default font that has better Unicode support
  doc.setFont('helvetica')
  
  // Set proper language for Turkish
  try {
    // Modern jsPDF handles UTF-8 well by default
    doc.setProperties({
      title: 'Proje Raporu',
      subject: 'Temsa Proje Yönetim Sistemi',
      creator: 'Temsa',
      language: 'tr-TR'
    })
  } catch (e) {
    // Fallback to default
    console.warn('Could not set Turkish properties:', e)
  }
}

// Professional PDF header
export function addProfessionalHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Clean header background
  doc.setFillColor(248, 250, 252)
  doc.rect(0, 0, pageWidth, 45, 'F')
  
  // Header border
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(1)
  doc.line(0, 45, pageWidth, 45)
  
  // Company name/logo area
  doc.setTextColor(67, 56, 202)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  addTurkishText(doc, 'TEMSA', 20, 20)
  
  // Report title
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  addTurkishText(doc, title, pageWidth / 2, 20, { align: 'center' })
  
  // Subtitle if provided
  if (subtitle) {
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    addTurkishText(doc, subtitle, pageWidth / 2, 32, { align: 'center' })
  }
  
  // Date
  doc.setTextColor(107, 114, 128)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const currentDate = new Date().toLocaleDateString('tr-TR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  addTurkishText(doc, currentDate, pageWidth - 20, 20, { align: 'right' })
  
  return 55 // Return Y position for content start
}

// Professional footer
export function addProfessionalFooter(doc: jsPDF, pageNumber?: number, totalPages?: number) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Footer line
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20)
  
  // Footer text
  doc.setTextColor(107, 114, 128)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  addTurkishText(doc, 'Temsa Proje Yönetim Sistemi', 20, pageHeight - 10)
  
  // Page number
  if (pageNumber) {
    const pageText = totalPages ? `${pageNumber} / ${totalPages}` : pageNumber.toString()
    addTurkishText(doc, `Sayfa ${pageText}`, pageWidth - 20, pageHeight - 10, { align: 'right' })
  }
}

// Simple section header
export function addSectionHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(248, 250, 252)
  doc.rect(20, y - 2, doc.internal.pageSize.getWidth() - 40, 20, 'F')
  
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  addTurkishText(doc, title, 25, y + 10)
  
  return y + 25
}

// Simple table with clean design
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
  const { columnWidths, headerBg = [248, 250, 252], rowHeight = 12, fontSize = 9 } = options || {}
  const pageWidth = doc.internal.pageSize.getWidth()
  const tableWidth = pageWidth - 40
  const colCount = headers.length
  const defaultColWidth = tableWidth / colCount
  const widths = columnWidths || new Array(colCount).fill(defaultColWidth)
  
  let currentY = startY
  
  // Table headers
  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2])
  doc.rect(20, currentY, tableWidth, rowHeight + 4, 'F')
  
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(fontSize)
  doc.setFont('helvetica', 'bold')
  
  let currentX = 20
  headers.forEach((header, index) => {
    addTurkishText(doc, header, currentX + 5, currentY + 8)
    currentX += widths[index]
  })
  
  currentY += rowHeight + 4
  
  // Table rows
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(55, 65, 81)
  
  rows.forEach((row, rowIndex) => {
    // Alternate row background
    if (rowIndex % 2 === 1) {
      doc.setFillColor(249, 250, 251)
      doc.rect(20, currentY, tableWidth, rowHeight + 2, 'F')
    }
    
    currentX = 20
    row.forEach((cell, colIndex) => {
      addTurkishText(doc, cell, currentX + 5, currentY + 8)
      currentX += widths[colIndex]
    })
    
    currentY += rowHeight + 2
  })
  
  // Table border
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.rect(20, startY, tableWidth, currentY - startY, 'D')
  
  return currentY + 10
}

// Simple statistics box
export function addStatsBox(
  doc: jsPDF, 
  stats: Array<{ label: string; value: string; color?: [number, number, number] }>, 
  startY: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const boxWidth = (pageWidth - 60) / stats.length
  let currentX = 20
  
  stats.forEach((stat) => {
    // Box background
    doc.setFillColor(249, 250, 251)
    doc.setDrawColor(226, 232, 240)
    doc.rect(currentX, startY, boxWidth, 40, 'FD')
    
    // Value
    doc.setTextColor(stat.color?.[0] || 67, stat.color?.[1] || 56, stat.color?.[2] || 202)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    addTurkishText(doc, stat.value, currentX + boxWidth / 2, startY + 18, { align: 'center' })
    
    // Label
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    addTurkishText(doc, stat.label, currentX + boxWidth / 2, startY + 30, { align: 'center' })
    
    currentX += boxWidth + 10
  })
  
  return startY + 50
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

// Enhanced text function that handles Turkish characters
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
  
  if (fontSize) {
    doc.setFontSize(fontSize)
  }
  
  doc.setFont('helvetica', fontStyle)
  
  // For jsPDF 3.x, we can use the text directly with proper encoding
  try {
    if (maxWidth) {
      // Split text if it exceeds maxWidth
      const lines = doc.splitTextToSize(text, maxWidth)
      if (Array.isArray(lines)) {
        lines.forEach((line: string, index: number) => {
          doc.text(line, x, y + (index * (fontSize || 12) * 0.4), { align })
        })
      } else {
        doc.text(lines, x, y, { align })
      }
    } else {
      doc.text(text, x, y, { align })
    }
  } catch (error) {
    console.warn('Error rendering Turkish text, using fallback:', error)
    // Fallback: replace Turkish characters
    const fallbackText = text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (match) => {
      return turkishCharMap[match] || match
    })
    
    if (maxWidth) {
      const lines = doc.splitTextToSize(fallbackText, maxWidth)
      if (Array.isArray(lines)) {
        lines.forEach((line: string, index: number) => {
          doc.text(line, x, y + (index * (fontSize || 12) * 0.4), { align })
        })
      } else {
        doc.text(lines, x, y, { align })
      }
    } else {
      doc.text(fallbackText, x, y, { align })
    }
  }
}

// Color constants for consistent theming
export const PDF_COLORS = {
  primary: [67, 56, 202] as const,
  secondary: [59, 130, 246] as const,
  success: [34, 197, 94] as const,
  warning: [245, 158, 11] as const,
  danger: [239, 68, 68] as const,
  text: [31, 41, 55] as const,
  textLight: [107, 114, 128] as const,
  background: [248, 250, 252] as const,
  white: [255, 255, 255] as const,
  black: [0, 0, 0] as const
}

// Status color mapping
export function getStatusColor(status: string): [number, number, number] {
  const statusColors: { [key: string]: [number, number, number] } = {
    'PLANNING': [146, 64, 14],
    'IN_PROGRESS': [30, 64, 175],
    'COMPLETED': [6, 95, 70],
    'ON_HOLD': [55, 65, 81],
    'TODO': [107, 114, 128],
    'REVIEW': [168, 85, 247],
    'BLOCKED': [239, 68, 68]
  }
  return statusColors[status] || PDF_COLORS.textLight
}

// Status text mapping
export function getStatusText(status: string): string {
  const statusTexts: { [key: string]: string } = {
    'PLANNING': 'Planlanıyor',
    'IN_PROGRESS': 'Devam Ediyor',
    'COMPLETED': 'Tamamlandı',
    'ON_HOLD': 'Beklemede',
    'TODO': 'Yapılacak',
    'REVIEW': 'İncelemede',
    'BLOCKED': 'Engellenmiş'
  }
  return statusTexts[status] || status
}

// Priority color mapping
export function getPriorityColor(priority: string): [number, number, number] {
  const priorityColors: { [key: string]: [number, number, number] } = {
    'URGENT': [239, 68, 68],
    'HIGH': [245, 158, 11],
    'MEDIUM': [59, 130, 246],
    'LOW': [34, 197, 94]
  }
  return priorityColors[priority] || PDF_COLORS.textLight
}

// Priority text mapping
export function getPriorityText(priority: string): string {
  const priorityTexts: { [key: string]: string } = {
    'URGENT': 'Acil',
    'HIGH': 'Yüksek',
    'MEDIUM': 'Orta',
    'LOW': 'Düşük'
  }
  return priorityTexts[priority] || priority
}
