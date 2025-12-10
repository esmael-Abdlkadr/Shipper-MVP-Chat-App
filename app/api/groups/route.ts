import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/groups - List user's groups
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
        members: {
          where: { userId: session.user.id },
          select: { role: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const formattedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      avatar: group.avatar,
      memberCount: group._count.members,
      myRole: group.members[0]?.role || 'member',
      lastMessage: group.messages[0]
        ? {
            content: group.messages[0].content,
            senderName: group.messages[0].isAI
              ? 'Shipper'
              : group.messages[0].sender?.name || 'Unknown',
            createdAt: group.messages[0].createdAt,
            isAI: group.messages[0].isAI,
          }
        : null,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }))

    return NextResponse.json(formattedGroups)
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, avatar, memberIds } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Create group with creator as admin
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        avatar: avatar || null,
        creatorId: session.user.id,
        members: {
          create: [
            // Creator is always admin
            { userId: session.user.id, role: 'admin' },
            // Add other members if provided
            ...(memberIds || [])
              .filter((id: string) => id !== session.user.id)
              .map((userId: string) => ({ userId, role: 'member' })),
          ],
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
        creator: {
          select: { id: true, name: true, image: true },
        },
      },
    })

    return NextResponse.json({
      id: group.id,
      name: group.name,
      description: group.description,
      avatar: group.avatar,
      memberCount: group._count.members,
      creator: group.creator,
      createdAt: group.createdAt,
    })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}

