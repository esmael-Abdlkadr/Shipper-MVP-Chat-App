import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildGroupContext } from '@/lib/ai/groupContext'
import { getAIProvider, parseModelFromMention, DEFAULT_MODEL } from '@/lib/ai/providers'

type RouteParams = { params: Promise<{ id: string }> }

// POST /api/groups/[id]/ai - Trigger AI response for @shipper mention or reply to AI
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id: groupId } = await params
    const { replyToId, triggerContent } = await request.json()

    // Verify membership and AI enabled
    const [membership, group] = await Promise.all([
      prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: session.user.id } },
      }),
      prisma.group.findUnique({
        where: { id: groupId },
        select: { aiEnabled: true },
      }),
    ])

    if (!membership) {
      return new Response('Not a member of this group', { status: 403 })
    }

    if (!group?.aiEnabled) {
      return new Response('AI is disabled for this group', { status: 403 })
    }

    // Parse model from trigger content (e.g., @shipper:openai, @shipper:gpt)
    const resolvedModel = triggerContent 
      ? parseModelFromMention(triggerContent) 
      : DEFAULT_MODEL

    // Build context from recent messages
    const { systemPrompt, history, lastUserMessage } = await buildGroupContext(groupId)

    // Validate replyToId - ignore temp IDs that don't exist in DB
    let validReplyToId: string | null = null
    if (replyToId && !replyToId.startsWith('temp-')) {
      // Check if the message exists
      const replyMessage = await prisma.groupMessage.findUnique({
        where: { id: replyToId },
        select: { id: true },
      })
      if (replyMessage) {
        validReplyToId = replyToId
      }
    }

    // Get the appropriate AI provider
    const generateResponse = getAIProvider(resolvedModel)

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = ''

          // Use the provider abstraction
          for await (const text of generateResponse({
            systemPrompt,
            history: history.slice(0, -1), // Exclude the last message as it will be the userMessage
            userMessage: lastUserMessage || triggerContent || '',
          })) {
            fullResponse += text

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text, model: resolvedModel })}\n\n`)
            )
          }

          // Save AI message to database with reply reference and model
          const aiMessage = await prisma.groupMessage.create({
            data: {
              groupId,
              senderId: null,
              content: fullResponse,
              isAI: true,
              replyToId: validReplyToId,
              aiModel: resolvedModel,
            },
            include: {
              replyTo: {
                select: {
                  id: true,
                  content: true,
                  isAI: true,
                  sender: {
                    select: { name: true },
                  },
                },
              },
            },
          })

          // Update group's updatedAt
          await prisma.group.update({
            where: { id: groupId },
            data: { updatedAt: new Date() },
          })

          // Format the reply info for the response
          const replyTo = aiMessage.replyTo
            ? {
                id: aiMessage.replyTo.id,
                content: aiMessage.replyTo.content,
                senderName: aiMessage.replyTo.isAI
                  ? 'Shipper'
                  : aiMessage.replyTo.sender?.name || 'Unknown',
                isAI: aiMessage.replyTo.isAI,
              }
            : null

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ 
                done: true, 
                messageId: aiMessage.id, 
                replyTo,
                model: resolvedModel 
              })}\n\n`
            )
          )
          controller.close()
        } catch (error) {
          console.error('AI generation error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: 'Failed to generate AI response' })}\n\n`
            )
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
  } catch (error) {
    console.error('AI route error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
