import { prisma } from '@/lib/prisma'

export interface PendingReminder {
  id: string
  taskId: string
  task: {
    id: string
    description: string
    groupId: string
    assignee: { id: string; name: string | null }
  }
}

export async function getDueReminders(): Promise<PendingReminder[]> {
  const reminders = await prisma.taskReminder.findMany({
    where: {
      sendAt: { lte: new Date() },
      sent: false,
    },
    include: {
      task: {
        include: {
          assignee: { select: { id: true, name: true } },
        },
      },
    },
  })

  return reminders.map((r) => ({
    id: r.id,
    taskId: r.taskId,
    task: {
      id: r.task.id,
      description: r.task.description,
      groupId: r.task.groupId,
      assignee: r.task.assignee,
    },
  }))
}

export async function markReminderSent(reminderId: string): Promise<void> {
  await prisma.taskReminder.update({
    where: { id: reminderId },
    data: { sent: true, sentAt: new Date() },
  })
}

export async function createReminder(
  taskId: string,
  sendAt: Date
): Promise<void> {
  await prisma.taskReminder.create({
    data: { taskId, sendAt },
  })
}

export async function scheduleDefaultReminder(taskId: string): Promise<void> {
  const sendAt = new Date()
  sendAt.setHours(sendAt.getHours() + 24)
  
  await createReminder(taskId, sendAt)
}

export function formatReminderMessage(task: {
  description: string
  assignee: { name: string | null }
}): string {
  const name = task.assignee.name || 'Hey'
  return `⏰ Reminder: ${name}, don't forget to complete: **${task.description}**\n\nUpdate us when you're done! Use \`@shipper:done\` to mark it complete.`
}

export async function checkAndProcessReminders(
  sendMessage: (groupId: string, content: string) => Promise<void>
): Promise<number> {
  const dueReminders = await getDueReminders()
  let processed = 0

  for (const reminder of dueReminders) {
    try {
      const message = formatReminderMessage(reminder.task)
      await sendMessage(reminder.task.groupId, message)
      await markReminderSent(reminder.id)
      processed++
    } catch (error) {
      console.error(`Failed to send reminder ${reminder.id}:`, error)
    }
  }

  return processed
}

