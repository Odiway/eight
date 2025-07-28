'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import {
  FileText,
  Download,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  Award,
  Calendar,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Task {
  id: string
  status: string
}

interface Member {
  user: {
    id: string
    name: string
  }
}

interface Project {
  id: string
  name: string
  description: string
  status: string
  updatedAt: string
  tasks: Task[]
  members: Member[]
}

interface ReportsData {
  generatedAt: string
  summary: {
    totalProjects: number
    totalTasks: number
    totalUsers: number
    completedProjects: number
    completedTasks: number
    overdueTasks: number
  }
  projects: Project[]
  departments: Record<
    string,
    {
      name: string
      userCount: number
      totalTasks: number
      completedTasks: number
      activeProjects: number
    }
  >
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/reports/general')
        if (!response.ok) {
          throw new Error('Failed to fetch reports data')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDownloadProject = (projectId: string) => {
    window.open(`/api/reports/project/${projectId}/pdf`, '_blank')
  }

  const handleDownloadGeneral = () => {
    window.open('/api/reports/general/pdf', '_blank')
  }

  const handleDownloadDepartments = () => {
    window.open('/api/reports/departments/pdf', '_blank')
  }

  const handleDownloadPerformance = () => {
    window.open('/api/reports/performance/pdf', '_blank')
  }

  const handleDownloadRiskAnalysis = () => {
    window.open('/api/reports/risk-analysis/pdf', '_blank')
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
        <Navbar />
        <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
          <div className='px-4 py-6 sm:px-0'>
            <div className='flex justify-center items-center h-64'>
              <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600'></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
        <Navbar />
        <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
          <div className='px-4 py-6 sm:px-0'>
            <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
              <h3 className='text-lg font-semibold text-red-800 mb-2'>
                Hata Oluştu
              </h3>
              <p className='text-red-600'>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { projects, summary, departments } = data

  // Convert the API response to match component expectations
  const statistics = {
    totalProjects: summary?.totalProjects || 0,
    completedProjects: summary?.completedProjects || 0,
    inProgressProjects:
      (summary?.totalProjects || 0) - (summary?.completedProjects || 0),
    totalTasks: summary?.totalTasks || 0,
    completedTasks: summary?.completedTasks || 0,
    overdueTasks: summary?.overdueTasks || 0,
    totalUsers: summary?.totalUsers || 0,
    activeDepartments: Object.keys(departments || {}).length,
  }

  // Convert departments object to array format  
  const departmentsArray = Object.values(departments || {}).map(
    (dept: ReportsData['departments'][string]) => ({
      name: dept.name,
      users: dept.userCount,
      projectCount: dept.activeProjects || 0,
      taskCount: dept.totalTasks,
      completedTasks: dept.completedTasks,
    })
  )

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <Navbar />

      <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <div className='flex justify-between items-center mb-8'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                İş Zekası ve Analitik Raporlar
              </h1>
              <p className='text-gray-600 mt-1'>
                Proje performansı, risk analizi ve kurumsal raporlama çözümleri
              </p>
            </div>
            <div className='text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow border border-gray-200'>
              <span className='flex items-center'>
                <Calendar className='w-4 h-4 mr-2' />
                {formatDate(new Date())}
              </span>
            </div>
          </div>

          {/* Statistics Overview */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <Target className='h-8 w-8 text-blue-600' />
                  </div>
                  <div className='ml-4 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Toplam Proje
                      </dt>
                      <dd className='text-2xl font-bold text-gray-900'>
                        {statistics.totalProjects}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <BarChart3 className='h-8 w-8 text-green-600' />
                  </div>
                  <div className='ml-4 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Tamamlanan Proje
                      </dt>
                      <dd className='text-2xl font-bold text-green-600'>
                        {statistics.completedProjects}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <Users className='h-8 w-8 text-purple-600' />
                  </div>
                  <div className='ml-4 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Toplam Çalışan
                      </dt>
                      <dd className='text-2xl font-bold text-purple-600'>
                        {statistics.totalUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'>
                    <TrendingUp className='h-8 w-8 text-indigo-600' />
                  </div>
                  <div className='ml-4 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>
                        Görev Tamamlama
                      </dt>
                      <dd className='text-2xl font-bold text-indigo-600'>
                        %
                        {statistics.totalTasks > 0
                          ? Math.round(
                              (statistics.completedTasks /
                                statistics.totalTasks) *
                                100
                            )
                          : 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Analysis */}
          <div className='bg-white shadow-xl rounded-2xl border border-gray-100 mb-8'>
            <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-600 to-orange-600'>
              <h3 className='text-lg font-semibold text-white flex items-center'>
                <AlertTriangle className='w-5 h-5 mr-2' />
                Risk Analizi
              </h3>
            </div>
            <div className='p-6'>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                {/* High Risk Projects */}
                <div className='border border-red-200 rounded-xl p-5 bg-red-50 relative overflow-hidden'>
                  <div className='absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-bl-full opacity-50'></div>
                  <div className='flex items-center justify-between mb-4'>
                    <h4 className='text-lg font-semibold text-red-800'>
                      Yüksek Risk
                    </h4>
                    <div className='flex items-center bg-red-100 px-2 py-1 rounded-full'>
                      <AlertTriangle className='w-4 h-4 text-red-600 mr-1' />
                      <span className='text-xs font-medium text-red-700'>ACIL</span>
                    </div>
                  </div>
                  <div className='text-3xl font-bold text-red-600 mb-2'>
                    {projects.filter(p => {
                      const overdueTasks = p.tasks?.filter(t => t.status !== 'COMPLETED').length || 0;
                      const totalTasks = p.tasks?.length || 0;
                      return totalTasks > 0 && (overdueTasks / totalTasks) > 0.5;
                    }).length}
                  </div>
                  <p className='text-sm text-red-700'>
                    %50+ tamamlanmamış görevli projeler
                  </p>
                  <div className='mt-3 flex items-center text-xs text-red-600'>
                    <div className='w-full bg-red-200 rounded-full h-1.5'>
                      <div 
                        className='bg-red-500 h-1.5 rounded-full transition-all duration-300'
                        style={{ width: `${Math.min(100, (projects.filter(p => {
                          const overdueTasks = p.tasks?.filter(t => t.status !== 'COMPLETED').length || 0;
                          const totalTasks = p.tasks?.length || 0;
                          return totalTasks > 0 && (overdueTasks / totalTasks) > 0.5;
                        }).length / Math.max(1, projects.length)) * 100)}%` }}
                      ></div>
                    </div>
                    <span className='ml-2'>Risk Oranı</span>
                  </div>
                </div>

                {/* Medium Risk Projects */}
                <div className='border border-yellow-200 rounded-xl p-5 bg-yellow-50 relative overflow-hidden'>
                  <div className='absolute top-0 right-0 w-16 h-16 bg-yellow-100 rounded-bl-full opacity-50'></div>
                  <div className='flex items-center justify-between mb-4'>
                    <h4 className='text-lg font-semibold text-yellow-800'>
                      Orta Risk
                    </h4>
                    <div className='flex items-center bg-yellow-100 px-2 py-1 rounded-full'>
                      <AlertTriangle className='w-4 h-4 text-yellow-600 mr-1' />
                      <span className='text-xs font-medium text-yellow-700'>DİKKAT</span>
                    </div>
                  </div>
                  <div className='text-3xl font-bold text-yellow-600 mb-2'>
                    {projects.filter(p => {
                      const overdueTasks = p.tasks?.filter(t => t.status !== 'COMPLETED').length || 0;
                      const totalTasks = p.tasks?.length || 0;
                      return totalTasks > 0 && (overdueTasks / totalTasks) >= 0.25 && (overdueTasks / totalTasks) <= 0.5;
                    }).length}
                  </div>
                  <p className='text-sm text-yellow-700'>
                    %25-50 arası tamamlanmamış görevli projeler
                  </p>
                  <div className='mt-3 flex items-center text-xs text-yellow-600'>
                    <div className='w-full bg-yellow-200 rounded-full h-1.5'>
                      <div 
                        className='bg-yellow-500 h-1.5 rounded-full transition-all duration-300'
                        style={{ width: `${Math.min(100, (projects.filter(p => {
                          const overdueTasks = p.tasks?.filter(t => t.status !== 'COMPLETED').length || 0;
                          const totalTasks = p.tasks?.length || 0;
                          return totalTasks > 0 && (overdueTasks / totalTasks) >= 0.25 && (overdueTasks / totalTasks) <= 0.5;
                        }).length / Math.max(1, projects.length)) * 100)}%` }}
                      ></div>
                    </div>
                    <span className='ml-2'>Risk Oranı</span>
                  </div>
                </div>

                {/* Low Risk Projects */}
                <div className='border border-green-200 rounded-xl p-5 bg-green-50 relative overflow-hidden'>
                  <div className='absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-bl-full opacity-50'></div>
                  <div className='flex items-center justify-between mb-4'>
                    <h4 className='text-lg font-semibold text-green-800'>
                      Düşük Risk
                    </h4>
                    <div className='flex items-center bg-green-100 px-2 py-1 rounded-full'>
                      <Award className='w-4 h-4 text-green-600 mr-1' />
                      <span className='text-xs font-medium text-green-700'>GÜVENLİ</span>
                    </div>
                  </div>
                  <div className='text-3xl font-bold text-green-600 mb-2'>
                    {projects.filter(p => {
                      const completedTasks = p.tasks?.filter(t => t.status === 'COMPLETED').length || 0;
                      const totalTasks = p.tasks?.length || 0;
                      return totalTasks > 0 && (completedTasks / totalTasks) >= 0.75;
                    }).length}
                  </div>
                  <p className='text-sm text-green-700'>
                    %75+ tamamlanmış görevli projeler
                  </p>
                  <div className='mt-3 flex items-center text-xs text-green-600'>
                    <div className='w-full bg-green-200 rounded-full h-1.5'>
                      <div 
                        className='bg-green-500 h-1.5 rounded-full transition-all duration-300'
                        style={{ width: `${Math.min(100, (projects.filter(p => {
                          const completedTasks = p.tasks?.filter(t => t.status === 'COMPLETED').length || 0;
                          const totalTasks = p.tasks?.length || 0;
                          return totalTasks > 0 && (completedTasks / totalTasks) >= 0.75;
                        }).length / Math.max(1, projects.length)) * 100)}%` }}
                      ></div>
                    </div>
                    <span className='ml-2'>Başarı Oranı</span>
                  </div>
                </div>
              </div>

              {/* Risk Details */}
              <div className='mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <h5 className='font-semibold text-gray-800 mb-3 flex items-center'>
                    <AlertTriangle className='w-4 h-4 mr-2 text-red-500' />
                    Risk Faktörleri
                  </h5>
                  <ul className='space-y-2 text-sm text-gray-600'>
                    <li className='flex items-center'>
                      <span className='w-2 h-2 bg-red-500 rounded-full mr-2'></span>
                      Tamamlanmamış görev oranı %50+
                    </li>
                    <li className='flex items-center'>
                      <span className='w-2 h-2 bg-yellow-500 rounded-full mr-2'></span>
                      Geciken proje teslim tarihleri
                    </li>
                    <li className='flex items-center'>
                      <span className='w-2 h-2 bg-orange-500 rounded-full mr-2'></span>
                      Atanmamış kritik görevler
                    </li>
                    <li className='flex items-center'>
                      <span className='w-2 h-2 bg-red-400 rounded-full mr-2'></span>
                      Kaynak yetersizliği
                    </li>
                  </ul>
                </div>
                
                <div className='bg-gray-50 rounded-lg p-4'>
                  <h5 className='font-semibold text-gray-800 mb-3 flex items-center'>
                    <Target className='w-4 h-4 mr-2 text-blue-500' />
                    Önleme Stratejileri
                  </h5>
                  <ul className='space-y-2 text-sm text-gray-600'>
                    <li className='flex items-center'>
                      <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
                      Haftalık ilerleme toplantıları
                    </li>
                    <li className='flex items-center'>
                      <span className='w-2 h-2 bg-purple-500 rounded-full mr-2'></span>
                      Otomatik görev yeniden atama
                    </li>
                    <li className='flex items-center'>
                      <span className='w-2 h-2 bg-green-500 rounded-full mr-2'></span>
                      Erken uyarı sistemi
                    </li>
                    <li className='flex items-center'>
                      <span className='w-2 h-2 bg-indigo-500 rounded-full mr-2'></span>
                      Kaynak tahsisi optimizasyonu
                    </li>
                  </ul>
                </div>

                <div className='bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200'>
                  <h5 className='font-semibold text-blue-800 mb-3 flex items-center'>
                    <TrendingUp className='w-4 h-4 mr-2 text-blue-600' />
                    Aksiyon Planı
                  </h5>
                  <div className='space-y-3'>
                    <div className='bg-white rounded-md p-3 border border-blue-100'>
                      <div className='text-xs font-medium text-blue-600 mb-1'>ACIL</div>
                      <div className='text-sm text-gray-700'>Yüksek riskli projeleri önceliklendir</div>
                    </div>
                    <div className='bg-white rounded-md p-3 border border-blue-100'>
                      <div className='text-xs font-medium text-yellow-600 mb-1'>KISA VADELİ</div>
                      <div className='text-sm text-gray-700'>Ekip kaynaklarını yeniden dağıt</div>
                    </div>
                    <div className='bg-white rounded-md p-3 border border-blue-100'>
                      <div className='text-xs font-medium text-green-600 mb-1'>UZUN VADELİ</div>
                      <div className='text-sm text-gray-700'>Risk izleme sistemini güçlendir</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Reports Table */}
          <div className='bg-white shadow-xl rounded-2xl border border-gray-100 mb-8'>
            <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-800 to-gray-900'>
              <h3 className='text-lg font-semibold text-white flex items-center'>
                <FileText className='w-5 h-5 mr-2' />
                Proje Dokümantasyon İndirmeleri
              </h3>
            </div>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Proje Adı
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Durum
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Görevler
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Ekip Üyeleri
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Son Güncelleme
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {data?.projects?.map((project) => {
                    const completedTasks =
                      project.tasks?.filter((t) => t.status === 'COMPLETED')
                        .length || 0
                    const totalTasks = project.tasks?.length || 0
                    const progressPercentage =
                      totalTasks > 0
                        ? Math.round((completedTasks / totalTasks) * 100)
                        : 0

                    return (
                      <tr key={project.id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div>
                            <div className='text-sm font-medium text-gray-900'>
                              {project.name}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {project.description}
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium ${
                              project.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : project.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : project.status === 'PLANNING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {project.status === 'COMPLETED'
                              ? 'Tamamlandı'
                              : project.status === 'IN_PROGRESS'
                              ? 'Devam Ediyor'
                              : project.status === 'PLANNING'
                              ? 'Planlanıyor'
                              : 'Beklemede'}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-900'>
                            {completedTasks}/{totalTasks} (%{progressPercentage}
                            )
                          </div>
                          <div className='w-full bg-gray-200 rounded-full h-2 mt-1'>
                            <div
                              className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {project.members?.length || 0} üye
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {formatDate(new Date(project.updatedAt))}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                          <button
                            onClick={() => handleDownloadProject(project.id)}
                            className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2'
                          >
                            <Download className='w-4 h-4 mr-1' />
                            PDF İndir
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* General Reports */}
          <div className='bg-white shadow-xl rounded-2xl border border-gray-100'>
            <div className='px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-teal-600'>
              <h3 className='text-lg font-semibold text-white flex items-center'>
                <FileText className='w-5 h-5 mr-2' />
                Dokümantasyon ve Raporlama Merkezi
              </h3>
              <p className='text-emerald-100 text-sm mt-1'>
                Profesyonel PDF raporları ve analitik belgeler
              </p>
            </div>
            <div className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                <div
                  className='bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-shadow cursor-pointer'
                  onClick={handleDownloadGeneral}
                >
                  <div className='flex items-center justify-between mb-4'>
                    <FileText className='w-8 h-8 text-blue-600' />
                    <Download className='w-5 h-5 text-blue-500' />
                  </div>
                  <h4 className='text-lg font-semibold text-blue-900 mb-2'>
                    Genel Sistem Raporu
                  </h4>
                  <p className='text-sm text-blue-700'>
                    Sistem geneli istatistikler, proje özeti ve departman dağılımı
                  </p>
                </div>

                <div
                  className='bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-shadow cursor-pointer'
                  onClick={handleDownloadDepartments}
                >
                  <div className='flex items-center justify-between mb-4'>
                    <Users className='w-8 h-8 text-green-600' />
                    <Download className='w-5 h-5 text-green-500' />
                  </div>
                  <h4 className='text-lg font-semibold text-green-900 mb-2'>
                    Departman Analizi
                  </h4>
                  <p className='text-sm text-green-700'>
                    Departman bazlı performans metrikleri ve kaynak dağılımı
                  </p>
                </div>

                <div
                  className='bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-shadow cursor-pointer'
                  onClick={handleDownloadPerformance}
                >
                  <div className='flex items-center justify-between mb-4'>
                    <TrendingUp className='w-8 h-8 text-purple-600' />
                    <Download className='w-5 h-5 text-purple-500' />
                  </div>
                  <h4 className='text-lg font-semibold text-purple-900 mb-2'>
                    Performans Analizi
                  </h4>
                  <p className='text-sm text-purple-700'>
                    Kullanıcı verimliliği ve proje başarı oranları
                  </p>
                </div>

                <div 
                  className='bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-shadow cursor-pointer'
                  onClick={handleDownloadRiskAnalysis}
                >
                  <div className='flex items-center justify-between mb-4'>
                    <AlertTriangle className='w-8 h-8 text-orange-600' />
                    <Download className='w-5 h-5 text-orange-500' />
                  </div>
                  <h4 className='text-lg font-semibold text-orange-900 mb-2'>
                    Risk Analizi Raporu
                  </h4>
                  <p className='text-sm text-orange-700'>
                    Proje riskleri, tehdit analizi ve önleme stratejileri
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
