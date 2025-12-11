import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseShipperCommand, ShipperCommand } from '@/lib/ai/commands'
import { generateGroupSummary } from '@/lib/ai/summaryGenerator'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id: groupId } = await params
    const { message } = await request.json()

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    })

    if (!membership) {
      return new Response('Not a member', { status: 403 })
    }

    const command = parseShipperCommand(message)
    if (!command) {
      return NextResponse.json({ handled: false })
    }

    const response = await handleCommand(command, groupId, session.user.id)
    return NextResponse.json({ handled: true, ...response })
  } catch (error) {
    console.error('Command error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

async function handleCommand(
  command: ShipperCommand,
  groupId: string,
  userId: string
): Promise<{ type: string; content: string; data?: unknown }> {
  switch (command.type) {
    case 'tasks':
      return handleTasksCommand(groupId, command.filter)

    case 'done':
      return handleDoneCommand(groupId, userId, command.taskRef)

    case 'assign':
      return handleAssignCommand(groupId, userId, command.assignee, command.description)

    case 'summarize':
      return handleSummarizeCommand(groupId, command.period)

    case 'chat':
      return { type: 'chat', content: '', data: { model: command.model } }

    default:
      return { type: 'unknown', content: 'Unknown command' }
  }
}

async function handleTasksCommand(
  groupId: string,
  filter?: { assignee?: string; status?: string }
): Promise<{ type: string; content: string; data?: unknown }> {
  const where: Record<string, unknown> = { groupId }
  
  if (filter?.status) {
    where.status = filter.status
  }
  
  if (filter?.assignee) {
    const user = await prisma.user.findFirst({
      where: { name: { contains: filter.assignee, mode: 'insensitive' } },
      select: { id: true },
    })
    if (user) {
      where.assigneeId = user.id
    }
  }

  const tasks = await prisma.groupTask.findMany({
    where,
    include: {
      assignee: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  if (tasks.length === 0) {
    return {
      type: 'tasks',
      content: '📋 No active tasks found.\n\nUse `@shipper:assign @user task description` to create one!',
    }
  }

  const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
  const done = tasks.filter((t) => t.status === 'done')

  let content = `📋 **Tasks** (${tasks.length})\n\n`

  if (pending.length > 0) {
    content += `**Pending (${pending.length})**\n`
    pending.forEach((t, i) => {
      const priority = t.priority !== 'normal' ? ` [${t.priority}]` : ''
      content += `${i + 1}. @${t.assignee?.name || 'Unknown'}: ${t.description}${priority}\n`
    })
    content += '\n'
  }

  if (done.length > 0) {
    content += `**Completed (${done.length})**\n`
    done.slice(0, 3).forEach((t) => {
      content += `✅ @${t.assignee?.name || 'Unknown'}: ${t.description}\n`
    })
  }

  content += '\nUse `@shipper:done` to mark your task complete!'

  return { type: 'tasks', content, data: { tasks } }
}

async function handleDoneCommand(
  groupId: string,
  userId: string,
  taskRef?: string
): Promise<{ type: string; content: string; data?: unknown }> {
  let task

  if (taskRef) {
    task = await prisma.groupTask.findFirst({
      where: {
        groupId,
        assigneeId: userId,
        status: { in: ['pending', 'in_progress'] },
        description: { contains: taskRef, mode: 'insensitive' },
      },
      include: { assignee: { select: { name: true } } },
    })
  } else {
    task = await prisma.groupTask.findFirst({
      where: {
        groupId,
        assigneeId: userId,
        status: { in: ['pending', 'in_progress'] },
      },
      orderBy: { createdAt: 'desc' },
      include: { assignee: { select: { name: true } } },
    })
  }

  if (!task) {
    return {
      type: 'done',
      content: "🤔 Couldn't find a matching task. Use `@shipper:tasks` to see your active tasks.",
    }
  }

  await prisma.groupTask.update({
    where: { id: task.id },
    data: { status: 'done', completedAt: new Date() },
  })

  return {
    type: 'done',
    content: `✅ Nice work! Task completed: **${task.description}**\n\n🎉 Keep crushing it!`,
    data: { task },
  }
}

async function handleAssignCommand(
  groupId: string,
  createdById: string,
  assigneeName: string,
  description: string
): Promise<{ type: string; content: string; data?: unknown }> {
  const assignee = await prisma.groupMember.findFirst({
    where: {
      groupId,
      user: { name: { contains: assigneeName, mode: 'insensitive' } },
    },
    include: { user: { select: { id: true, name: true } } },
  })

  if (!assignee) {
    return {
      type: 'assign',
      content: `❌ Couldn't find @${assigneeName} in this group. Make sure they're a member!`,
    }
  }

  const task = await prisma.groupTask.create({
    data: {
      groupId,
      assigneeId: assignee.user.id,
      createdById,
      description,
      status: 'pending',
      priority: 'normal',
    },
    include: { assignee: { select: { name: true } } },
  })

  return {
    type: 'assign',
    content: `📋 Task created!\n\n**@${task.assignee?.name}** is now assigned: **${description}**\n\nI'll remind them if needed!`,
    data: { task },
  }
}

async function handleSummarizeCommand(
  groupId: string,
  period: 'today' | 'week' | 'month'
): Promise<{ type: string; content: string }> {
  const summary = await generateGroupSummary(groupId, period)
  return { type: 'summarize', content: summary }
}

