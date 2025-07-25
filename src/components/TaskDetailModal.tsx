import React from 'react'
import { X } from 'lucide-react'

interface TaskDetailModalProps {
  task: any
  onClose: () => void
}

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Task Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          <p><strong>Title:</strong> {task.title}</p>
          <p><strong>Status:</strong> {task.status}</p>
          <p><strong>Priority:</strong> {task.priority}</p>
          {task.description && (
            <p><strong>Description:</strong> {task.description}</p>
          )}
          {/* Display assigned users - prioritize multiple assignments over legacy single assignment */}
          {task.assignedUsers && task.assignedUsers.length > 0 ? (
            <div>
              <strong>Assigned to:</strong>
              <div className="mt-1 flex flex-wrap gap-1">
                {task.assignedUsers.map((assignment: any) => (
                  <span 
                    key={assignment.user.id}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {assignment.user.name}
                  </span>
                ))}
              </div>
            </div>
          ) : task.assignedUser && (
            <p><strong>Assigned to:</strong> {task.assignedUser.name}</p>
          )}
          {task.estimatedHours && (
            <p><strong>Estimated Hours:</strong> {task.estimatedHours}h</p>
          )}
          {task.startDate && (
            <p><strong>Start Date:</strong> {new Date(task.startDate).toLocaleDateString()}</p>
          )}
          {task.endDate && (
            <p><strong>End Date:</strong> {new Date(task.endDate).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </div>
  )
}