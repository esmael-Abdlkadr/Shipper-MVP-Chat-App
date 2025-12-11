import { prisma } from '@/lib/prisma'
import { ChatMessage } from './providers'

export type GroupMessageContext = {
  id: string
  content: string
  senderName: string | null
  isAI: boolean
  createdAt: Date
}

export type GroupMemberContext = {
  name: string | null
  role: string
}

/**
 * Build context for AI from recent group messages
 * Returns ChatMessage format that works with both Gemini and OpenAI
 */
export async function buildGroupContext(
  groupId: string,
  messageLimit: number = 30
): Promise<{
  systemPrompt: string
  history: ChatMessage[]
  lastUserMessage: string
}> {
  // Fetch group info
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
  })

  if (!group) {
    throw new Error('Group not found')
  }

  // Fetch recent messages
  const messages = await prisma.groupMessage.findMany({
    where: { groupId },
    include: {
      sender: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: messageLimit,
  })

  // Reverse to get chronological order
  const chronologicalMessages = messages.reverse()

  // Build member list
  const memberNames = group.members
    .map((m) => m.user.name || 'Unknown')
    .filter((n) => n !== 'Unknown')
    .join(', ')

  // Build system prompt
  const systemPrompt = `You are Shipper, a fun and engaging AI assistant participating in a group chat called "${group.name}".

ABOUT THE GROUP:
- Group name: ${group.name}
${group.description ? `- Description: ${group.description}` : ''}
- Members: ${memberNames}
- Total members: ${group.members.length}

YOUR PERSONALITY:
- You're casual, friendly, and match the group's energy
- Use emojis naturally but don't overdo it
- Be helpful and add value to conversations
- You can be playful and joke around
- Address people by their names when relevant
- Keep responses concise unless more detail is needed

IMPORTANT:
- You were just mentioned with @shipper in the chat
- Respond naturally as if you're part of the conversation
- Reference recent messages when relevant to show you understand the context
- Don't start with greetings every time - just jump into the conversation naturally`

  // Build conversation history using ChatMessage format (works with both providers)
  const history: ChatMessage[] = []
  let lastUserMessage = ''

  for (const msg of chronologicalMessages) {
    if (msg.isAI) {
      // AI messages go as 'assistant'
      history.push({
        role: 'assistant',
        content: msg.content,
      })
    } else {
      // User messages with sender context
      const senderName = msg.sender?.name || 'Someone'
      const content = `[${senderName}]: ${msg.content}`
      history.push({
        role: 'user',
        content,
      })
      lastUserMessage = content
    }
  }

  return { systemPrompt, history, lastUserMessage }
}

/**
 * Format context as a simple text summary (alternative approach)
 */
export function formatContextAsText(
  messages: GroupMessageContext[],
  members: GroupMemberContext[],
  groupName: string
): string {
  const memberList = members
    .map((m) => m.name || 'Unknown')
    .filter((n) => n !== 'Unknown')
    .join(', ')

  const recentChat = messages
    .slice(-20) // Last 20 messages
    .map((m) => {
      const sender = m.isAI ? '🤖 Shipper' : m.senderName || 'Unknown'
      return `${sender}: ${m.content}`
    })
    .join('\n')

  return `
GROUP: ${groupName}
MEMBERS: ${memberList}

RECENT CONVERSATION:
${recentChat}

---
Someone just mentioned @shipper. Respond to the conversation above naturally.
`.trim()
}

