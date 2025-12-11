import { prisma } from '@/lib/prisma'
import { getAIProvider } from './providers'
import { ModelId } from './config'

export type SummaryPeriod = 'today' | 'week' | 'month'

function getDateRange(period: SummaryPeriod): { start: Date; end: Date } {
  const now = new Date()
  const end = now
  let start: Date

  switch (period) {
    case 'today':
      start = new Date(now.setHours(0, 0, 0, 0))
      break
    case 'week':
      start = new Date(now.setDate(now.getDate() - 7))
      break
    case 'month':
      start = new Date(now.setMonth(now.getMonth() - 1))
      break
    default:
      start = new Date(now.setHours(0, 0, 0, 0))
  }

  return { start, end: new Date() }
}

export async function generateGroupSummary(
  groupId: string,
  period: SummaryPeriod = 'today',
  model: ModelId = 'gemini'
): Promise<string> {
  const { start, end } = getDateRange(period)

  const [messages, tasks, group] = await Promise.all([
    prisma.groupMessage.findMany({
      where: {
        groupId,
        createdAt: { gte: start, lte: end },
        deletedAt: null,
      },
      include: {
        sender: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.groupTask.findMany({
      where: {
        groupId,
        OR: [
          { createdAt: { gte: start, lte: end } },
          { completedAt: { gte: start, lte: end } },
        ],
      },
      include: {
        assignee: { select: { name: true } },
      },
    }),
    prisma.group.findUnique({
      where: { id: groupId },
      select: { name: true },
    }),
  ])

  const completedTasks = tasks.filter((t) => t.status === 'done')
  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
  const activeMembers = new Set(messages.filter((m) => !m.isAI).map((m) => m.sender?.name).filter(Boolean))

  const conversationSnippet = messages
    .slice(-30)
    .map((m) => {
      const sender = m.isAI ? 'Shipper' : (m.sender?.name || 'Unknown')
      return `${sender}: ${m.content.slice(0, 100)}`
    })
    .join('\n')

  const prompt = `Generate a concise group chat summary.

GROUP: ${group?.name || 'Unknown'}
PERIOD: ${period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
MESSAGES: ${messages.length}
ACTIVE MEMBERS: ${Array.from(activeMembers).join(', ') || 'None'}

COMPLETED TASKS (${completedTasks.length}):
${completedTasks.map((t) => `- ${t.assignee?.name}: ${t.description}`).join('\n') || 'None'}

PENDING TASKS (${pendingTasks.length}):
${pendingTasks.map((t) => `- ${t.assignee?.name}: ${t.description} (${t.status})`).join('\n') || 'None'}

RECENT CONVERSATION:
${conversationSnippet || 'No messages'}

Create a brief, friendly summary with:
1. What was accomplished
2. Key discussions/decisions
3. What's pending
Use emojis sparingly. Be concise.`

  try {
    const generateResponse = getAIProvider(model)
    let summary = ''

    for await (const text of generateResponse({
      systemPrompt: 'You are a helpful assistant that creates concise group activity summaries.',
      history: [],
      userMessage: prompt,
    })) {
      summary += text
    }

    return summary
  } catch {
    const fallback = `📊 **${period === 'today' ? "Today's" : period === 'week' ? "This Week's" : "This Month's"} Summary**

✅ Completed: ${completedTasks.length} tasks
🔄 Pending: ${pendingTasks.length} tasks
💬 Messages: ${messages.length}
👥 Active: ${Array.from(activeMembers).join(', ') || 'No activity'}

${completedTasks.length > 0 ? `\nCompleted:\n${completedTasks.map((t) => `- ${t.assignee?.name}: ${t.description}`).join('\n')}` : ''}
${pendingTasks.length > 0 ? `\nPending:\n${pendingTasks.map((t) => `- ${t.assignee?.name}: ${t.description}`).join('\n')}` : ''}`

    return fallback
  }
}

