import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string; taskId: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id: groupId, taskId } = await params

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    })

    if (!membership) {
      return new Response('Not a member', { status: 403 })
    }

    const task = await prisma.groupTask.findFirst({
      where: { id: taskId, groupId },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } },
        reminders: true,
      },
    })

    if (!task) {
      return new Response('Task not found', { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id: groupId, taskId } = await params
    const body = await request.json()
    const { status, description, priority, dueDate } = body

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    })

    if (!membership) {
      return new Response('Not a member', { status: 403 })
    }

    const existingTask = await prisma.groupTask.findFirst({
      where: { id: taskId, groupId },
    })

    if (!existingTask) {
      return new Response('Task not found', { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    
    if (status) {
      updateData.status = status
      if (status === 'done') {
        updateData.completedAt = new Date()
      }
    }
    if (description) updateData.description = description
    if (priority) updateData.priority = priority
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null
    }

    const task = await prisma.groupTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id: groupId, taskId } = await params

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    })

    if (!membership) {
      return new Response('Not a member', { status: 403 })
    }

    const task = await prisma.groupTask.findFirst({
      where: { id: taskId, groupId },
    })

    if (!task) {
      return new Response('Task not found', { status: 404 })
    }

    if (task.createdById !== session.user.id && membership.role !== 'admin') {
      return new Response('Not authorized to delete this task', { status: 403 })
    }

    await prisma.groupTask.delete({ where: { id: taskId } })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting task:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

