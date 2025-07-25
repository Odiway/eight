import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import ProjectSettingsClient from '@/components/ProjectSettingsClient'

async function getProject(id: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignedUser: true,
            assignedUsers: {
              include: {
                user: true,
              },
            },
          },
        },
        members: {
          include: {
            user: true,
          },
        },
        workflowSteps: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    if (!project) {
      notFound()
    }

    return project
  } catch (error) {
    console.error('Error fetching project:', error)
    notFound()
  }
}

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProject(id)

  return <ProjectSettingsClient project={project} />
}
