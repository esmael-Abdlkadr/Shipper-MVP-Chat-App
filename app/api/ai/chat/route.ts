import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPersonalityPrompt, PersonalityType, ModelId } from '@/lib/ai/config'
import { getQuickActionPrompt, QuickActionType } from '@/lib/ai/games'
import { getAIProvider, resolveModel, ChatMessage } from '@/lib/ai/providers'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { message, conversationId, personality, quickAction, model: requestedModel } = await request.json()

    if (!message?.trim()) {
      return new Response('Message is required', { status: 400 })
    }

    const activePersonality = (personality || 'hype') as PersonalityType

    // Get user's preferred model
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferredAIModel: true },
    })

    let conversation = conversationId
      ? await prisma.aIConversation.findFirst({
          where: { id: conversationId, userId: session.user.id },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        })
      : null

    // Resolve which model to use
    const resolvedModel = resolveModel(
      requestedModel,
      conversation?.model,
      user?.preferredAIModel
    )

    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: {
          userId: session.user.id,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          model: resolvedModel,
        },
        include: { messages: true },
      })
    } else if (requestedModel && conversation.model !== requestedModel) {
      // Update conversation model if user explicitly switched
      await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { model: resolvedModel },
      })
    }

    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    })

    // Convert to ChatMessage format for provider
    const history: ChatMessage[] = conversation.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    let systemPrompt = getPersonalityPrompt(activePersonality)
    
    if (quickAction) {
      const actionPrompt = getQuickActionPrompt(quickAction as QuickActionType)
      systemPrompt = `${systemPrompt}\n\n--- CURRENT TASK ---\n${actionPrompt}`
    }

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
            userMessage: message,
          })) {
            fullResponse += text
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                text, 
                conversationId: conversation.id,
                model: resolvedModel 
              })}\n\n`)
            )
          }

          await prisma.aIMessage.create({
            data: {
              conversationId: conversation.id,
              role: 'assistant',
              content: fullResponse,
              model: resolvedModel,
            },
          })

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              done: true, 
              conversationId: conversation.id,
              model: resolvedModel 
            })}\n\n`)
          )
          controller.close()
        } catch (error) {
          console.error('AI generation error:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`)
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
