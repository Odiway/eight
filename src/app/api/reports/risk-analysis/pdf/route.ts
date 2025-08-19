import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jsPDF from 'jspdf'
import { formatTurkishText } from '@/lib/pdf-utils'
import { calculateDynamicProjectDates, getDelaySeverity } from '@/lib/dynamic-dates'

const prisma = new PrismaClient()

// Mock data for error cases
const mockRiskData = {
  highRiskProjects: [
    { name: 'Test Projesi 1', riskLevel: 'Yuksek', completionRate: 25 },
    { name: 'Test Projesi 2', riskLevel: 'Yuksek', completionRate: 30 },
  ],
  mediumRiskProjects: [
    { name: 'Test Projesi 3', riskLevel: 'Orta', completionRate: 60 },
    { name: 'Test Projesi 4', riskLevel: 'Orta', completionRate: 45 },
  ],
  lowRiskProjects: [
    { name: 'Test Projesi 5', riskLevel: 'Dusuk', completionRate: 85 },
    { name: 'Test Projesi 6', riskLevel: 'Dusuk', completionRate: 90 },
  ],
  riskFactors: [
    'Tamamlanmamis gorev orani yuksek',
    'Proje durumu belirsiz',
    'Ekip uyesi atanmamis gorevler',
  ],
  mitigationStrategies: [
    'Duzenli ilerleme takibi',
    'Ekip kaynaklarinin optimize edilmesi',
    'Proaktif mudahale planlari',
  ],
}

async function generateRiskAnalysisPDF() {
  try {
    // Try to get real data from database with enhanced task details
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            startDate: true,
            endDate: true,
            completedAt: true,
          },
        },
      },
    })

    if (projects.length === 0) {
      console.log('No projects found, using mock data')
      return generatePDF(mockRiskData)
    }

    // Calculate dynamic dates and enhanced risk levels for each project
    const projectsWithRisk = projects.map(project => {
      const dynamicDates = calculateDynamicProjectDates(project.tasks, project)
      const delaySeverity = getDelaySeverity(dynamicDates.delayDays)
      
      // Enhanced risk level calculation based on multiple factors
      let riskLevel = 'Dusuk'
      if (dynamicDates.status === 'completed') {
        riskLevel = 'Dusuk'
      } else if (delaySeverity === 'critical' || dynamicDates.delayDays > 45) {
        riskLevel = 'Yuksek'
      } else if (delaySeverity === 'high' || dynamicDates.delayDays > 21) {
        riskLevel = 'Orta'
      } else if (dynamicDates.completionPercentage < 30 && dynamicDates.delayDays > 7) {
        riskLevel = 'Orta'
      } else if (dynamicDates.delayBreakdown?.overdueTasksDelay && dynamicDates.delayBreakdown.overdueTasksDelay > 14) {
        riskLevel = 'Yuksek'
      }

      return {
        project,
        name: project.name,
        riskLevel,
        completionRate: Math.round(dynamicDates.completionPercentage),
        delayDays: dynamicDates.delayDays,
        status: dynamicDates.status,
        criticalTaskCount: dynamicDates.criticalPath.length,
        overdueTaskCount: dynamicDates.delayBreakdown?.overdueTaskDetails.length || 0,
        dominantDelayFactor: dynamicDates.delayBreakdown?.dominantFactor
      }
    })

    // Categorize projects by enhanced risk levels
    const highRiskProjects = projectsWithRisk.filter(p => p.riskLevel === 'Yuksek')
    const mediumRiskProjects = projectsWithRisk.filter(p => p.riskLevel === 'Orta')
    const lowRiskProjects = projectsWithRisk.filter(p => p.riskLevel === 'Dusuk')

    const riskData = {
      highRiskProjects,
      mediumRiskProjects,
      lowRiskProjects,
      riskFactors: [
        'Gecikmis gorevler ve teslim tarihleri',
        'Dusuk proje tamamlanma oranlari (%30 altı)',
        'Kritik oncelikli gorevlerde yogunlasma',
        'Takim uyesi atama eksiklikleri',
        'Proje zaman cizelgesi sapmalari (21+ gun)',
        'Dinamik tarih analizine gore yuksek gecikme'
      ],
      mitigationStrategies: [
        'Dinamik tarih takibi ve erken uyarı sistemleri',
        'Gecikmis gorevlerin oncelikli tamamlanması',
        'Kaynak tahsisi optimizasyonu',
        'Haftalik ilerleme toplantilari ve takip',  
        'Otomatik risk degerlendirme matrisi kullanımı',
        'Gecikme faktorlerinin surekli izlenmesi'
      ],
      // Enhanced statistics
      stats: {
        totalProjects: projects.length,
        averageCompletionRate: Math.round(projectsWithRisk.reduce((sum, p) => sum + p.completionRate, 0) / projectsWithRisk.length),
        totalDelayDays: projectsWithRisk.reduce((sum, p) => sum + p.delayDays, 0),
        criticalTasksTotal: projectsWithRisk.reduce((sum, p) => sum + p.criticalTaskCount, 0)
      }
    }

    console.log('📊 Enhanced Risk Analysis Generated:', {
      totalProjects: projects.length,
      highRisk: highRiskProjects.length,
      mediumRisk: mediumRiskProjects.length,
      lowRisk: lowRiskProjects.length,
      totalDelayDays: riskData.stats.totalDelayDays,
      avgCompletion: riskData.stats.averageCompletionRate + '%'
    })

    return generatePDF(riskData)
  } catch (error) {
    console.error('Database error, using mock data:', error)
    return generatePDF(mockRiskData)
  }
}

function generatePDF(riskData: any) {
  const pdf = new jsPDF()
  let yPosition = 20

  // Header
  pdf.setFontSize(20)
  pdf.text(formatTurkishText('Risk Analizi Raporu'), 20, yPosition)
  yPosition += 15

  pdf.setFontSize(12)
  pdf.text(
    formatTurkishText(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`),
    20,
    yPosition
  )
  yPosition += 20

  // High Risk Projects
  pdf.setFontSize(14)
  pdf.text(formatTurkishText('Yuksek Risk Projeleri'), 20, yPosition)
  yPosition += 10

  if (riskData.highRiskProjects.length > 0) {
    riskData.highRiskProjects.forEach((project: any, index: number) => {
      if (yPosition > 270) {
        pdf.addPage()
        yPosition = 20
      }
      pdf.setFontSize(10)
      const delayInfo = project.delayDays ? ` (${project.delayDays} gun gecikme)` : ''
      const overdueInfo = project.overdueTaskCount ? ` - ${project.overdueTaskCount} geciken gorev` : ''
      pdf.text(
        formatTurkishText(
          `${index + 1}. ${project.name} - %${project.completionRate}${delayInfo}${overdueInfo}`
        ),
        25,
        yPosition
      )
      yPosition += 8
    })
  } else {
    pdf.setFontSize(10)
    pdf.text(
      formatTurkishText('Yuksek risk projesi bulunmamaktadir.'),
      25,
      yPosition
    )
    yPosition += 8
  }
  yPosition += 10

  // Medium Risk Projects
  pdf.setFontSize(14)
  pdf.text(formatTurkishText('Orta Risk Projeleri'), 20, yPosition)
  yPosition += 10

  if (riskData.mediumRiskProjects.length > 0) {
    riskData.mediumRiskProjects.forEach((project: any, index: number) => {
      if (yPosition > 270) {
        pdf.addPage()
        yPosition = 20
      }
      pdf.setFontSize(10)
      const delayInfo = project.delayDays ? ` (${project.delayDays} gun gecikme)` : ''
      const overdueInfo = project.overdueTaskCount ? ` - ${project.overdueTaskCount} geciken gorev` : ''
      pdf.text(
        formatTurkishText(
          `${index + 1}. ${project.name} - %${project.completionRate}${delayInfo}${overdueInfo}`
        ),
        25,
        yPosition
      )
      yPosition += 8
    })
  } else {
    pdf.setFontSize(10)
    pdf.text(
      formatTurkishText('Orta risk projesi bulunmamaktadir.'),
      25,
      yPosition
    )
    yPosition += 8
  }
  yPosition += 10

  // Low Risk Projects
  pdf.setFontSize(14)
  pdf.text(formatTurkishText('Dusuk Risk Projeleri'), 20, yPosition)
  yPosition += 10

  if (riskData.lowRiskProjects.length > 0) {
    riskData.lowRiskProjects.forEach((project: any, index: number) => {
      if (yPosition > 270) {
        pdf.addPage()
        yPosition = 20
      }
      pdf.setFontSize(10)
      const statusInfo = project.status === 'completed' ? ' (Tamamlandi)' : ''
      pdf.text(
        formatTurkishText(
          `${index + 1}. ${project.name} - %${project.completionRate}${statusInfo}`
        ),
        25,
        yPosition
      )
      yPosition += 8
    })
  } else {
    pdf.setFontSize(10)
    pdf.text(
      formatTurkishText('Dusuk risk projesi bulunmamaktadir.'),
      25,
      yPosition
    )
    yPosition += 8
  }
  yPosition += 15

  // Risk Factors
  if (yPosition > 250) {
    pdf.addPage()
    yPosition = 20
  }

  pdf.setFontSize(14)
  pdf.text(formatTurkishText('Risk Faktorleri'), 20, yPosition)
  yPosition += 10

  riskData.riskFactors.forEach((factor: string, index: number) => {
    pdf.setFontSize(10)
    pdf.text(formatTurkishText(`${index + 1}. ${factor}`), 25, yPosition)
    yPosition += 8
  })
  yPosition += 10

  // Mitigation Strategies
  pdf.setFontSize(14)
  pdf.text(formatTurkishText('Onleme Stratejileri'), 20, yPosition)
  yPosition += 10

  riskData.mitigationStrategies.forEach((strategy: string, index: number) => {
    pdf.setFontSize(10)
    pdf.text(formatTurkishText(`${index + 1}. ${strategy}`), 25, yPosition)
    yPosition += 8
  })

  yPosition += 15

  // Risk Assessment Summary
  if (yPosition > 240) {
    pdf.addPage()
    yPosition = 20
  }

  pdf.setFontSize(14)
  pdf.text(formatTurkishText('Risk Degerlendirme Ozeti'), 20, yPosition)
  yPosition += 15

  const totalProjects =
    riskData.highRiskProjects.length +
    riskData.mediumRiskProjects.length +
    riskData.lowRiskProjects.length
  if (totalProjects > 0) {
    const highRiskPercentage = Math.round(
      (riskData.highRiskProjects.length / totalProjects) * 100
    )
    const mediumRiskPercentage = Math.round(
      (riskData.mediumRiskProjects.length / totalProjects) * 100
    )
    const lowRiskPercentage = Math.round(
      (riskData.lowRiskProjects.length / totalProjects) * 100
    )

    pdf.setFontSize(10)
    pdf.text(
      formatTurkishText(`Toplam Proje Sayisi: ${totalProjects}`),
      25,
      yPosition
    )
    yPosition += 8
    pdf.text(
      formatTurkishText(`Yuksek Risk: ${riskData.highRiskProjects.length} proje (%${highRiskPercentage})`),
      25,
      yPosition
    )
    yPosition += 8
    pdf.text(
      formatTurkishText(`Orta Risk: ${riskData.mediumRiskProjects.length} proje (%${mediumRiskPercentage})`),
      25,
      yPosition
    )
    yPosition += 8
    pdf.text(
      formatTurkishText(`Dusuk Risk: ${riskData.lowRiskProjects.length} proje (%${lowRiskPercentage})`),
      25,
      yPosition
    )
    yPosition += 8

    // Enhanced statistics if available
    if (riskData.stats) {
      yPosition += 5
      pdf.text(
        formatTurkishText(`Ortalama Tamamlanma Orani: %${riskData.stats.averageCompletionRate}`),
        25,
        yPosition
      )
      yPosition += 8
      pdf.text(
        formatTurkishText(`Toplam Gecikme Gun Sayisi: ${riskData.stats.totalDelayDays}`),
        25,
        yPosition
      )
      yPosition += 8
      pdf.text(
        formatTurkishText(`Kritik Gorev Sayisi: ${riskData.stats.criticalTasksTotal}`),
        25,
        yPosition
      )
      yPosition += 8
    }
    yPosition += 15
  }

  // Risk Level Recommendations
  pdf.setFontSize(14)
  pdf.text(formatTurkishText('Risk Seviyesi Onerileri'), 20, yPosition)
  yPosition += 15

  const recommendations = [
    'Yuksek Risk: Acil mudahale gerekli, gunluk takip',
    'Orta Risk: Haftalik gozden gecirme, onlem al',
    'Dusuk Risk: Aylik izleme, proaktif planlama',
  ]

  recommendations.forEach((rec, index) => {
    pdf.setFontSize(10)
    pdf.text(formatTurkishText(`${index + 1}. ${rec}`), 25, yPosition)
    yPosition += 8
  })

  return pdf.output('arraybuffer')
}

export async function GET(request: NextRequest) {
  try {
    const pdfBuffer = await generateRiskAnalysisPDF()

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="risk-analizi-raporu.pdf"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error) {
    console.error('Risk analysis PDF generation error:', error)
    return NextResponse.json(
      { error: 'Risk analizi PDF oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}
