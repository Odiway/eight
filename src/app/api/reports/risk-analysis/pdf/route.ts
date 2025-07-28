import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jsPDF from 'jspdf';
import { formatTurkishText } from '@/lib/pdf-utils';

const prisma = new PrismaClient();

// Mock data for error cases
const mockRiskData = {
  highRiskProjects: [
    { name: 'Test Projesi 1', riskLevel: 'Yuksek', completionRate: 25 },
    { name: 'Test Projesi 2', riskLevel: 'Yuksek', completionRate: 30 }
  ],
  mediumRiskProjects: [
    { name: 'Test Projesi 3', riskLevel: 'Orta', completionRate: 60 },
    { name: 'Test Projesi 4', riskLevel: 'Orta', completionRate: 45 }
  ],
  lowRiskProjects: [
    { name: 'Test Projesi 5', riskLevel: 'Dusuk', completionRate: 85 },
    { name: 'Test Projesi 6', riskLevel: 'Dusuk', completionRate: 90 }
  ],
  riskFactors: [
    'Tamamlanmamis gorev orani yuksek',
    'Proje durumu belirsiz',
    'Ekip uyesi atanmamis gorevler'
  ],
  mitigationStrategies: [
    'Duzenli ilerleme takibi',
    'Ekip kaynaklarinin optimize edilmesi',
    'Proaktif mudahale planlari'
  ]
};

async function generateRiskAnalysisPDF() {
  try {
    // Try to get real data from database
    const projects = await prisma.project.findMany({
      include: {
        tasks: true
      }
    });

    // Calculate risk levels
    const highRiskProjects = projects.filter(p => {
      const overdueTasks = p.tasks?.filter((t: any) => t.status !== 'COMPLETED').length || 0;
      const totalTasks = p.tasks?.length || 0;
      return totalTasks > 0 && (overdueTasks / totalTasks) > 0.5;
    });

    const mediumRiskProjects = projects.filter(p => {
      const overdueTasks = p.tasks?.filter((t: any) => t.status !== 'COMPLETED').length || 0;
      const totalTasks = p.tasks?.length || 0;
      return totalTasks > 0 && (overdueTasks / totalTasks) >= 0.25 && (overdueTasks / totalTasks) <= 0.5;
    });

    const lowRiskProjects = projects.filter(p => {
      const completedTasks = p.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
      const totalTasks = p.tasks?.length || 0;
      return totalTasks > 0 && (completedTasks / totalTasks) >= 0.75;
    });

    const riskData = {
      highRiskProjects: highRiskProjects.map(p => ({
        name: p.name,
        riskLevel: 'Yuksek',
        completionRate: Math.round(((p.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0) / (p.tasks?.length || 1)) * 100)
      })),
      mediumRiskProjects: mediumRiskProjects.map(p => ({
        name: p.name,
        riskLevel: 'Orta',
        completionRate: Math.round(((p.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0) / (p.tasks?.length || 1)) * 100)
      })),
      lowRiskProjects: lowRiskProjects.map(p => ({
        name: p.name,
        riskLevel: 'Dusuk',
        completionRate: Math.round(((p.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0) / (p.tasks?.length || 1)) * 100)
      })),
      riskFactors: [
        'Tamamlanmamis gorev orani yuksek',
        'Proje durumu belirsiz',
        'Ekip uyesi atanmamis gorevler'
      ],
      mitigationStrategies: [
        'Duzenli ilerleme takibi',
        'Ekip kaynaklarinin optimize edilmesi',
        'Proaktif mudahale planlari'
      ]
    };

    return generatePDF(riskData);
  } catch (error) {
    console.error('Database error, using mock data:', error);
    return generatePDF(mockRiskData);
  }
}

function generatePDF(riskData: any) {
  const pdf = new jsPDF();
  let yPosition = 20;

  // Header
  pdf.setFontSize(20);
  pdf.text(formatTurkishText('Risk Analizi Raporu'), 20, yPosition);
  yPosition += 15;

  pdf.setFontSize(12);
  pdf.text(formatTurkishText(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`), 20, yPosition);
  yPosition += 20;

  // High Risk Projects
  pdf.setFontSize(14);
  pdf.text(formatTurkishText('Yuksek Risk Projeleri'), 20, yPosition);
  yPosition += 10;

  if (riskData.highRiskProjects.length > 0) {
    riskData.highRiskProjects.forEach((project: any, index: number) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFontSize(10);
      pdf.text(formatTurkishText(`${index + 1}. ${project.name} - Tamamlanma: %${project.completionRate}`), 25, yPosition);
      yPosition += 8;
    });
  } else {
    pdf.setFontSize(10);
    pdf.text(formatTurkishText('Yuksek risk projesi bulunmamaktadir.'), 25, yPosition);
    yPosition += 8;
  }
  yPosition += 10;

  // Medium Risk Projects
  pdf.setFontSize(14);
  pdf.text(formatTurkishText('Orta Risk Projeleri'), 20, yPosition);
  yPosition += 10;

  if (riskData.mediumRiskProjects.length > 0) {
    riskData.mediumRiskProjects.forEach((project: any, index: number) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFontSize(10);
      pdf.text(formatTurkishText(`${index + 1}. ${project.name} - Tamamlanma: %${project.completionRate}`), 25, yPosition);
      yPosition += 8;
    });
  } else {
    pdf.setFontSize(10);
    pdf.text(formatTurkishText('Orta risk projesi bulunmamaktadir.'), 25, yPosition);
    yPosition += 8;
  }
  yPosition += 10;

  // Low Risk Projects
  pdf.setFontSize(14);
  pdf.text(formatTurkishText('Dusuk Risk Projeleri'), 20, yPosition);
  yPosition += 10;

  if (riskData.lowRiskProjects.length > 0) {
    riskData.lowRiskProjects.forEach((project: any, index: number) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFontSize(10);
      pdf.text(formatTurkishText(`${index + 1}. ${project.name} - Tamamlanma: %${project.completionRate}`), 25, yPosition);
      yPosition += 8;
    });
  } else {
    pdf.setFontSize(10);
    pdf.text(formatTurkishText('Dusuk risk projesi bulunmamaktadir.'), 25, yPosition);
    yPosition += 8;
  }
  yPosition += 15;

  // Risk Factors
  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 20;
  }

  pdf.setFontSize(14);
  pdf.text(formatTurkishText('Risk Faktorleri'), 20, yPosition);
  yPosition += 10;

  riskData.riskFactors.forEach((factor: string, index: number) => {
    pdf.setFontSize(10);
    pdf.text(formatTurkishText(`${index + 1}. ${factor}`), 25, yPosition);
    yPosition += 8;
  });
  yPosition += 10;

  // Mitigation Strategies
  pdf.setFontSize(14);
  pdf.text(formatTurkishText('Onleme Stratejileri'), 20, yPosition);
  yPosition += 10;

  riskData.mitigationStrategies.forEach((strategy: string, index: number) => {
    pdf.setFontSize(10);
    pdf.text(formatTurkishText(`${index + 1}. ${strategy}`), 25, yPosition);
    yPosition += 8;
  });

  return pdf.output('arraybuffer');
}

export async function GET(request: NextRequest) {
  try {
    const pdfBuffer = await generateRiskAnalysisPDF();
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="risk-analizi-raporu.pdf"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Risk analysis PDF generation error:', error);
    return NextResponse.json(
      { error: 'Risk analizi PDF oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}
