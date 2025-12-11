import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateGroupSummary, SummaryPeriod } from '@/lib/ai/summaryGenerator'
import { ModelId } from '@/lib/ai/config'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id: groupId } = await params
    const body = await request.json()
    const period = (body.period || 'today') as SummaryPeriod
    const model = (body.model || 'gemini') as ModelId

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.user.id } },
    })

    if (!membership) {
      return new Response('Not a member', { status: 403 })
    }

    const summary = await generateGroupSummary(groupId, period, model)

    return NextResponse.json({ summary, period })
  } catch (error) {
    console.error('Error generating summary:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

