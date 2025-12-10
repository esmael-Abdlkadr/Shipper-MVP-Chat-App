import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

// Helper to check if user is admin/creator
async function getUserRole(groupId: string, userId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  })
  return member?.role || null
}

async function isCreator(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { creatorId: true },
  })
  return group?.creatorId === userId
}

// GET /api/groups/[id] - Get group details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user is a member
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: session.user.id } },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, image: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, image: true, isOnline: true },
            },
          },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
        _count: {
          select: { members: true, messages: true },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: group.id,
      name: group.name,
      description: group.description,
      avatar: group.avatar,
      aiEnabled: group.aiEnabled,
      maxMembers: group.maxMembers,
      creator: group.creator,
      members: group.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        image: m.user.image,
        isOnline: m.user.isOnline,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      memberCount: group._count.members,
      messageCount: group._count.messages,
      myRole: membership.role,
      isCreator: group.creatorId === session.user.id,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    })
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 })
  }
}

// PATCH /api/groups/[id] - Update group (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const role = await getUserRole(id, session.user.id)

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update group' }, { status: 403 })
    }

    const { name, description, avatar, aiEnabled } = await request.json()

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (avatar !== undefined) updateData.avatar = avatar
    if (aiEnabled !== undefined) updateData.aiEnabled = aiEnabled

    const group = await prisma.group.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        aiEnabled: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
  }
}

// DELETE /api/groups/[id] - Delete group (creator only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const isGroupCreator = await isCreator(id, session.user.id)

    if (!isGroupCreator) {
      return NextResponse.json({ error: 'Only the creator can delete the group' }, { status: 403 })
    }

    await prisma.group.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}

