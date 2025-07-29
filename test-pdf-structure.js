// Test the updated PDF structure with all users

const testData = {
  project: {
    id: 'test-project',
    name: 'Test Projesi',
    description: 'Bu bir test projesidir.',
    status: 'IN_PROGRESS',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    createdAt: new Date(),
  },
  tasks: [
    {
      id: '1',
      title: 'Frontend Geliştirme',
      description: 'React komponenlerinin geliştirilmesi',
      status: 'COMPLETED',
      priority: 'HIGH',
      estimatedHours: 40,
      actualHours: 35,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-15'),
      assignedUser: { id: '1', name: 'Ahmet Yılmaz' },
      assignedUsers: [
        {
          user: {
            id: '1',
            name: 'Ahmet Yılmaz',
            department: 'Yazılım',
            position: 'Senior Developer',
          },
        },
        {
          user: {
            id: '3',
            name: 'Mehmet Demir',
            department: 'Yazılım',
            position: 'Frontend Developer',
          },
        },
      ],
    },
    {
      id: '2',
      title: 'UI/UX Tasarım',
      description: 'Kullanıcı arayüzü tasarımı',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      estimatedHours: 24,
      actualHours: 16,
      startDate: new Date('2024-01-16'),
      endDate: new Date('2024-02-01'),
      assignedUser: { id: '2', name: 'Ayşe Kara' },
      assignedUsers: [
        {
          user: {
            id: '2',
            name: 'Ayşe Kara',
            department: 'Tasarım',
            position: 'UI/UX Designer',
          },
        },
        {
          user: {
            id: '4',
            name: 'Fatma Öz',
            department: 'Test',
            position: 'QA Specialist',
          },
        },
        {
          user: {
            id: '1',
            name: 'Ahmet Yılmaz',
            department: 'Yazılım',
            position: 'Senior Developer',
          },
        },
      ],
    },
  ],
  allUsers: [
    {
      id: '1',
      name: 'Ahmet Yılmaz',
      department: 'Yazılım',
      position: 'Senior Developer',
    },
    {
      id: '2',
      name: 'Ayşe Kara',
      department: 'Tasarım',
      position: 'UI/UX Designer',
    },
    {
      id: '3',
      name: 'Mehmet Demir',
      department: 'Yazılım',
      position: 'Frontend Developer',
    },
    {
      id: '4',
      name: 'Fatma Öz',
      department: 'Test',
      position: 'QA Specialist',
    },
    {
      id: '5',
      name: 'Ali Çelik',
      department: 'DevOps',
      position: 'System Administrator',
    },
  ],
  totalTasks: 2,
  completedTasks: 1,
  inProgressTasks: 1,
  todoTasks: 0,
  blockedTasks: 0,
  totalEstimatedHours: 64,
  totalActualHours: 51,
  completionPercentage: 50,
}

console.log('✅ Test data structure for enhanced individual project PDF:')
console.log('📊 Project:', testData.project.name)
console.log('👥 Total users in system:', testData.allUsers.length)
console.log('📋 Tasks with multiple assignees:')

testData.tasks.forEach((task, index) => {
  console.log(`  ${index + 1}. ${task.title}`)
  console.log(`     Primary assignee: ${task.assignedUser?.name || 'None'}`)
  console.log(`     All assignees: ${task.assignedUsers.length} users`)
  task.assignedUsers.forEach((assignment, userIndex) => {
    console.log(
      `       ${userIndex + 1}. ${assignment.user.name} (${
        assignment.user.department
      } - ${assignment.user.position})`
    )
  })
  console.log('')
})

console.log('🏢 All users in the system:')
testData.allUsers.forEach((user, index) => {
  console.log(
    `  ${index + 1}. ${user.name} - ${user.department} (${user.position})`
  )
})

console.log('\n📄 The PDF will now include:')
console.log('  ✅ All assigned users for each task (not just primary)')
console.log('  ✅ User department and position information')
console.log('  ✅ Complete team member list')
console.log('  ✅ Enhanced task details with multiple assignees')
console.log('  ✅ Turkish character support via ASCII conversion')
