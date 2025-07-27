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
    'REVIEW': [168, 85, 247]
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
    'REVIEW': 'İncelemede'
  }
  return statusTexts[status] || status
}

// Priority color mapping
export function getPriorityColor(priority: string): [number, number, number] {
  const priorityColors: { [key: string]: [number, number, number] } = {
    'HIGH': [239, 68, 68],
    'MEDIUM': [245, 158, 11],
    'LOW': [34, 197, 94]
  }
  return priorityColors[priority] || PDF_COLORS.textLight
}

// Priority text mapping
export function getPriorityText(priority: string): string {
  const priorityTexts: { [key: string]: string } = {
    'HIGH': 'Yüksek',
    'MEDIUM': 'Orta',
    'LOW': 'Düşük'
  }
  return priorityTexts[priority] || priority
}
