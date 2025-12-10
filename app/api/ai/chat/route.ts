import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ai } from '@/lib/ai/client'
import { AI_MODEL, getPersonalityPrompt, PersonalityType } from '@/lib/ai/config'
import { getQuickActionPrompt, QuickActionType } from '@/lib/ai/games'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { message, conversationId, personality, quickAction } = await request.json()

    if (!message?.trim()) {
      return new Response('Message is required', { status: 400 })
    }

    const activePersonality = (personality || 'hype') as PersonalityType

    let conversation = conversationId
      ? await prisma.aIConversation.findFirst({
          where: { id: conversationId, userId: session.user.id },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        })
      : null

    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: {
          userId: session.user.id,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        },
        include: { messages: true },
      })
    }

    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    })

    const history = conversation.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user' as 'user' | 'model',
      parts: [{ text: m.content }],
    }))

    history.push({
      role: 'user',
      parts: [{ text: message }],
    })

    let systemPrompt = getPersonalityPrompt(activePersonality)
    
    if (quickAction) {
      const actionPrompt = getQuickActionPrompt(quickAction as QuickActionType)
      systemPrompt = `${systemPrompt}\n\n--- CURRENT TASK ---\n${actionPrompt}`
    }

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
              encoder.encode(`data: ${JSON.stringify({ text, conversationId: conversation.id })}\n\n`)
            )
          }

          await prisma.aIMessage.create({
            data: {
              conversationId: conversation.id,
              role: 'assistant',
              content: fullResponse,
            },
          })

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, conversationId: conversation.id })}\n\n`)
          )
          controller.close()
        } catch (error) {
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
