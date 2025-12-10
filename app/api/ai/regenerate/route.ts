import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ai } from '@/lib/ai/client'
import { AI_MODEL, getPersonalityPrompt, PersonalityType } from '@/lib/ai/config'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { conversationId, personality } = await request.json()

    if (!conversationId) {
      return new Response('Conversation ID is required', { status: 400 })
    }

    const activePersonality = (personality || 'hype') as PersonalityType

    const conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })

    if (!conversation) {
      return new Response('Conversation not found', { status: 404 })
    }

    const lastAssistantMessage = [...conversation.messages]
      .reverse()
      .find((m) => m.role === 'assistant')

    if (lastAssistantMessage) {
      await prisma.aIMessage.delete({
        where: { id: lastAssistantMessage.id },
      })
    }

    const messagesWithoutLast = conversation.messages.filter(
      (m) => m.id !== lastAssistantMessage?.id
    )

    const history = messagesWithoutLast.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user' as 'user' | 'model',
      parts: [{ text: m.content }],
    }))

    const systemPrompt = getPersonalityPrompt(activePersonality)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await ai.models.generateContentStream({
            model: AI_MODEL,
            contents: history,
            config: {
              systemInstruction: systemPrompt,
            },
          })

          let fullResponse = ''

          for await (const chunk of response) {
            const text = chunk.text || ''
            fullResponse += text
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text, conversationId })}\n\n`)
            )
          }

          await prisma.aIMessage.create({
            data: {
              conversationId,
              role: 'assistant',
              content: fullResponse,
            },
          })

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, conversationId })}\n\n`)
          )
          controller.close()
        } catch {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Failed to regenerate response' })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch {
    return new Response('Internal Server Error', { status: 500 })
  }
}
