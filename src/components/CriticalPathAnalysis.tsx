'use client'

import React, { useState, useMemo } from 'react'
import { 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Target, 
  Zap,
  ChevronRight,
  Calendar,
  Users,
  BarChart3,
  Activity,
  ArrowRight,
  Gauge
} from 'lucide-react'

interface Task {
  id: string
  title: string
  estimatedHours: number
  actualHours?: number
  startDate: Date
  endDate: Date
  dependencies: string[]
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED'
  assignedUsers: Array<{
    user: { id: string; name: string }
  }>
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

interface CriticalPathNode {
  id: string
  task: Task
  earlyStart: number
  earlyFinish: number
  lateStart: number
  lateFinish: number
  slack: number
  isCritical: boolean
}

interface CriticalPathAnalysisProps {
  tasks: Task[]
  projectStartDate: Date
  onOptimize?: (recommendations: OptimizationRecommendation[]) => void
}

interface OptimizationRecommendation {
  type: 'REDUCE_DURATION' | 'PARALLEL_EXECUTION' | 'RESOURCE_ALLOCATION' | 'DEPENDENCY_OPTIMIZATION'
  taskId: string
  taskTitle: string
  currentDuration: number
  suggestedDuration: number
  timeSaved: number
  effort: 'LOW' | 'MEDIUM' | 'HIGH'
  description: string
  action: string
}

export default function CriticalPathAnalysis({ 
  tasks, 
  projectStartDate, 
  onOptimize 
}: CriticalPathAnalysisProps) {
  const [selectedOptimization, setSelectedOptimization] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Calculate Critical Path using CPM (Critical Path Method)
  const criticalPathAnalysis = useMemo(() => {
    if (!tasks.length) return { nodes: [], criticalPath: [], totalDuration: 0 }

    // Create nodes for each task
    const nodes: { [key: string]: CriticalPathNode } = {}
    
    tasks.forEach(task => {
      const duration = Math.ceil(task.estimatedHours / 8) // Convert hours to days
      nodes[task.id] = {
        id: task.id,
        task,
        earlyStart: 0,
        earlyFinish: duration,
        lateStart: 0,
        lateFinish: duration,
        slack: 0,
        isCritical: false
      }
    })

    // Forward pass - calculate early start and early finish
    const visited = new Set<string>()
    const calculateEarlyDates = (taskId: string): void => {
      if (visited.has(taskId)) return
      visited.add(taskId)

      const node = nodes[taskId]
      if (!node) return

      // Calculate early start based on dependencies
      let maxEarlyFinish = 0
      node.task.dependencies.forEach(depId => {
        if (nodes[depId]) {
          calculateEarlyDates(depId)
          maxEarlyFinish = Math.max(maxEarlyFinish, nodes[depId].earlyFinish)
        }
      })

      node.earlyStart = maxEarlyFinish
      node.earlyFinish = node.earlyStart + Math.ceil(node.task.estimatedHours / 8)
    }

    // Calculate early dates for all tasks
    Object.keys(nodes).forEach(taskId => calculateEarlyDates(taskId))

    // Project duration is the maximum early finish
    const totalDuration = Math.max(...Object.values(nodes).map(n => n.earlyFinish))

    // Backward pass - calculate late start and late finish
    const backwardVisited = new Set<string>()
    const calculateLateDates = (taskId: string): void => {
      if (backwardVisited.has(taskId)) return
      backwardVisited.add(taskId)

      const node = nodes[taskId]
      if (!node) return

      // Find tasks that depend on this task
      const dependents = Object.values(nodes).filter(n => 
        n.task.dependencies.includes(taskId)
      )

      if (dependents.length === 0) {
        // No dependents, so late finish = early finish
        node.lateFinish = totalDuration
      } else {
        // Calculate late finish based on dependents
        let minLateStart = Infinity
        dependents.forEach(dependent => {
          calculateLateDates(dependent.id)
          minLateStart = Math.min(minLateStart, dependent.lateStart)
        })
        node.lateFinish = minLateStart
      }

      node.lateStart = node.lateFinish - Math.ceil(node.task.estimatedHours / 8)
      node.slack = node.lateStart - node.earlyStart
      node.isCritical = node.slack === 0
    }

    // Calculate late dates for all tasks
    Object.keys(nodes).forEach(taskId => calculateLateDates(taskId))

    // Find critical path
    const criticalTasks = Object.values(nodes).filter(n => n.isCritical)
    const criticalPath = criticalTasks.map(n => n.id)

    return {
      nodes: Object.values(nodes),
      criticalPath,
      totalDuration
    }
  }, [tasks])

  // Generate optimization recommendations
  const optimizationRecommendations = useMemo((): OptimizationRecommendation[] => {
    const recommendations: OptimizationRecommendation[] = []
    const { nodes, criticalPath } = criticalPathAnalysis

    criticalPath.forEach(taskId => {
      const node = nodes.find(n => n.id === taskId)
      if (!node) return

      const task = node.task
      const currentDuration = Math.ceil(task.estimatedHours / 8)

      // 1. Reduce Duration Recommendation
      if (currentDuration > 1) {
        const suggestedReduction = Math.max(1, Math.floor(currentDuration * 0.2)) // 20% reduction
        const newDuration = currentDuration - suggestedReduction
        
        recommendations.push({
          type: 'REDUCE_DURATION',
          taskId: task.id,
          taskTitle: task.title,
          currentDuration,
          suggestedDuration: newDuration,
          timeSaved: suggestedReduction,
          effort: currentDuration > 5 ? 'HIGH' : 'MEDIUM',
          description: `Bu görevi daha verimli hale getirerek ${suggestedReduction} gün tasarruf edilebilir`,
          action: 'Görev kapsamını azaltın veya daha deneyimli kaynak atayın'
        })
      }

      // 2. Parallel Execution Recommendation
      const dependents = nodes.filter(n => n.task.dependencies.includes(taskId))
      if (dependents.length > 1) {
        const parallelizableTime = Math.min(...dependents.map(d => Math.ceil(d.task.estimatedHours / 8)))
        
        recommendations.push({
          type: 'PARALLEL_EXECUTION',
          taskId: task.id,
          taskTitle: task.title,
          currentDuration,
          suggestedDuration: currentDuration,
          timeSaved: parallelizableTime,
          effort: 'MEDIUM',
          description: `Bu görevden sonraki ${dependents.length} görev paralel çalıştırılabilir`,
          action: 'Bağımlı görevleri aynı anda başlatmak için kaynak planlaması yapın'
        })
      }

      // 3. Resource Allocation Recommendation
      if (task.assignedUsers.length === 1 && currentDuration > 3) {
        const additionalResources = Math.min(2, Math.floor(currentDuration / 3))
        const timeSaved = Math.floor(currentDuration * 0.3 * additionalResources)
        
        recommendations.push({
          type: 'RESOURCE_ALLOCATION',
          taskId: task.id,
          taskTitle: task.title,
          currentDuration,
          suggestedDuration: currentDuration - timeSaved,
          timeSaved,
          effort: additionalResources > 1 ? 'HIGH' : 'MEDIUM',
          description: `${additionalResources} ek kaynak ekleyerek ${timeSaved} gün tasarruf edilebilir`,
          action: `${additionalResources} ek team member atayın ve iş bölümü yapın`
        })
      }
    })

    // Sort by time saved (descending)
    return recommendations.sort((a, b) => b.timeSaved - a.timeSaved)
  }, [criticalPathAnalysis])

  const criticalTasks = criticalPathAnalysis.nodes.filter(n => n.isCritical)
  const totalTimeSavings = optimizationRecommendations.reduce((sum, rec) => sum + rec.timeSaved, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Kritik Yol Analizi</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Toplam Süre</span>
            </div>
            <div className="text-2xl font-bold">{criticalPathAnalysis.totalDuration} gün</div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Kritik Görevler</span>
            </div>
            <div className="text-2xl font-bold">{criticalTasks.length}</div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Potansiyel Tasarruf</span>
            </div>
            <div className="text-2xl font-bold">{totalTimeSavings} gün</div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-5 h-5" />
              <span className="text-sm font-medium">Optimizasyon Oranı</span>
            </div>
            <div className="text-2xl font-bold">
              {((totalTimeSavings / criticalPathAnalysis.totalDuration) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Critical Path Visualization */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Kritik Yol Görevleri</h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            {showDetails ? 'Detayları Gizle' : 'Detayları Göster'}
          </button>
        </div>

        <div className="space-y-4">
          {criticalTasks.map((node, index) => (
            <div key={node.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{node.task.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>🕒 {Math.ceil(node.task.estimatedHours / 8)} gün</span>
                      <span>👥 {node.task.assignedUsers.length} kişi</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        node.task.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                        node.task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {node.task.priority}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">Slack Time</div>
                  <div className="text-lg font-bold text-red-600">{node.slack} gün</div>
                </div>
              </div>

              {showDetails && (
                <div className="border-t border-red-200 pt-3 mt-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Erken Başlangıç:</span>
                      <div className="font-medium">Gün {node.earlyStart}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Erken Bitiş:</span>
                      <div className="font-medium">Gün {node.earlyFinish}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Geç Başlangıç:</span>
                      <div className="font-medium">Gün {node.lateStart}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Geç Bitiş:</span>
                      <div className="font-medium">Gün {node.lateFinish}</div>
                    </div>
                  </div>
                </div>
              )}

              {index < criticalTasks.length - 1 && (
                <div className="flex justify-center mt-4">
                  <ArrowRight className="w-6 h-6 text-red-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Optimization Recommendations */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-bold text-gray-900">Optimizasyon Önerileri</h3>
          </div>
          
          {onOptimize && (
            <button
              onClick={() => onOptimize(optimizationRecommendations)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Tüm Önerileri Uygula
            </button>
          )}
        </div>

        <div className="space-y-4">
          {optimizationRecommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Optimizasyon önerisi bulunamadı</p>
              <p className="text-sm">Projeniz zaten oldukça optimize görünüyor</p>
            </div>
          ) : (
            optimizationRecommendations.map((recommendation, index) => (
              <div
                key={`${recommendation.taskId}-${recommendation.type}`}
                className={`border rounded-lg p-4 transition-all cursor-pointer ${
                  selectedOptimization === `${recommendation.taskId}-${recommendation.type}`
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedOptimization(
                  selectedOptimization === `${recommendation.taskId}-${recommendation.type}` 
                    ? null 
                    : `${recommendation.taskId}-${recommendation.type}`
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      recommendation.type === 'REDUCE_DURATION' ? 'bg-blue-500' :
                      recommendation.type === 'PARALLEL_EXECUTION' ? 'bg-green-500' :
                      recommendation.type === 'RESOURCE_ALLOCATION' ? 'bg-purple-500' :
                      'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">{recommendation.taskTitle}</h4>
                      <p className="text-sm text-gray-600">{recommendation.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      -{recommendation.timeSaved} gün
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      recommendation.effort === 'LOW' ? 'bg-green-100 text-green-700' :
                      recommendation.effort === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {recommendation.effort === 'LOW' ? 'Kolay' : 
                       recommendation.effort === 'MEDIUM' ? 'Orta' : 'Zor'}
                    </div>
                  </div>
                </div>

                {selectedOptimization === `${recommendation.taskId}-${recommendation.type}` && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Mevcut Durum</h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Süre: {recommendation.currentDuration} gün</div>
                          <div>Optimizasyon Tipi: {
                            recommendation.type === 'REDUCE_DURATION' ? 'Süre Azaltma' :
                            recommendation.type === 'PARALLEL_EXECUTION' ? 'Paralel Çalışma' :
                            recommendation.type === 'RESOURCE_ALLOCATION' ? 'Kaynak Tahsisi' :
                            'Bağımlılık Optimizasyonu'
                          }</div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Önerilen Aksiyon</h5>
                        <p className="text-sm text-gray-600">{recommendation.action}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Impact Analysis */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-green-500" />
          <h3 className="text-xl font-bold text-gray-900">Etki Analizi</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Zaman Analizi</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Mevcut Süre:</span>
                <span className="font-bold">{criticalPathAnalysis.totalDuration} gün</span>
              </div>
              <div className="flex justify-between">
                <span>Optimize Edilmiş:</span>
                <span className="font-bold text-green-600">
                  {criticalPathAnalysis.totalDuration - totalTimeSavings} gün
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tasarruf:</span>
                <span className="font-bold text-blue-600">{totalTimeSavings} gün</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-900">Kaynak Etkisi</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Kritik Görevler:</span>
                <span className="font-bold">{criticalTasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Ek Kaynak Gerekli:</span>
                <span className="font-bold text-orange-600">
                  {optimizationRecommendations
                    .filter(r => r.type === 'RESOURCE_ALLOCATION')
                    .length} görev
                </span>
              </div>
              <div className="flex justify-between">
                <span>Paralel Çalışma:</span>
                <span className="font-bold text-green-600">
                  {optimizationRecommendations
                    .filter(r => r.type === 'PARALLEL_EXECUTION')
                    .length} fırsat
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-900">ROI Analizi</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Optimizasyon Oranı:</span>
                <span className="font-bold">
                  {((totalTimeSavings / criticalPathAnalysis.totalDuration) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Uygulama Zorluğu:</span>
                <span className="font-bold text-yellow-600">
                  {optimizationRecommendations.some(r => r.effort === 'HIGH') ? 'Yüksek' :
                   optimizationRecommendations.some(r => r.effort === 'MEDIUM') ? 'Orta' : 'Düşük'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Önerilen Aksiyon:</span>
                <span className="font-bold text-green-600">{optimizationRecommendations.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
