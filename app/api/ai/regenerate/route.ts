import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPersonalityPrompt, PersonalityType } from '@/lib/ai/config'
import { getAIProvider, resolveModel, ChatMessage } from '@/lib/ai/providers'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { conversationId, personality, model: requestedModel } = await request.json()

    if (!conversationId) {
      return new Response('Conversation ID is required', { status: 400 })
    }

    const activePersonality = (personality || 'hype') as PersonalityType

    // Get user's preferred model
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferredAIModel: true },
    })

    const conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })

    if (!conversation) {
      return new Response('Conversation not found', { status: 404 })
    }

    // Resolve which model to use
    const resolvedModel = resolveModel(
      requestedModel,
      conversation.model,
      user?.preferredAIModel
    )

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

    // Get the last user message
    const lastUserMessage = [...messagesWithoutLast]
      .reverse()
      .find((m) => m.role === 'user')

    if (!lastUserMessage) {
      return new Response('No user message to regenerate from', { status: 400 })
    }

    // Convert to ChatMessage format (excluding the last user message as it will be passed separately)
    const history: ChatMessage[] = messagesWithoutLast
      .filter((m) => m.id !== lastUserMessage.id)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const systemPrompt = getPersonalityPrompt(activePersonality)

    // Get the appropriate AI provider
    const generateResponse = getAIProvider(resolvedModel)

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = ''

          for await (const text of generateResponse({
            systemPrompt,
            history,
            userMessage: lastUserMessage.content,
          })) {
            fullResponse += text
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                text, 
                conversationId,
                model: resolvedModel 
              })}\n\n`)
            )
          }

          await prisma.aIMessage.create({
            data: {
              conversationId,
              role: 'assistant',
              content: fullResponse,
              model: resolvedModel,
            },
          })

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              done: true, 
              conversationId,
              model: resolvedModel 
            })}\n\n`)
          )
          controller.close()
        } catch (error) {
          console.error('AI regeneration error:', error)
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
