import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id: groupId } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assignee')

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    })

    if (!membership) {
      return new Response('Not a member', { status: 403 })
    }

    const tasks = await prisma.groupTask.findMany({
      where: {
        groupId,
        ...(status && { status }),
        ...(assigneeId && { assigneeId }),
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id: groupId } = await params
    const body = await request.json()
    const { assigneeId, description, priority, dueDate, sourceMessageId } = body

    if (!assigneeId || !description) {
      return new Response('Missing required fields', { status: 400 })
    }

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    })

    if (!membership) {
      return new Response('Not a member', { status: 403 })
    }

    const assigneeMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: assigneeId } },
    })

    if (!assigneeMembership) {
      return new Response('Assignee is not a member', { status: 400 })
    }

    const task = await prisma.groupTask.create({
      data: {
        groupId,
        assigneeId,
        createdById: session.user.id,
        description,
        priority: priority || 'normal',
        dueDate: dueDate ? new Date(dueDate) : null,
        sourceMessageId,
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    if (task.dueDate) {
      const reminderDate = new Date(task.dueDate)
      reminderDate.setHours(reminderDate.getHours() - 2)
      
      if (reminderDate > new Date()) {
        await prisma.taskReminder.create({
          data: {
            taskId: task.id,
            sendAt: reminderDate,
          },
        })
      }
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

