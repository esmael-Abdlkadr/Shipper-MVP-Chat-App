import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string; userId: string }> }

// Helper to get group info and roles
async function getGroupContext(groupId: string, currentUserId: string, targetUserId: string) {
  const [group, currentMember, targetMember] = await Promise.all([
    prisma.group.findUnique({
      where: { id: groupId },
      select: { creatorId: true },
    }),
    prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: currentUserId } },
      select: { role: true },
    }),
    prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      select: { role: true },
    }),
  ])

  return {
    isCreator: group?.creatorId === currentUserId,
    isAdmin: currentMember?.role === 'admin',
    isSelf: currentUserId === targetUserId,
    targetIsCreator: group?.creatorId === targetUserId,
    targetRole: targetMember?.role,
    creatorId: group?.creatorId,
  }
}

// PATCH /api/groups/[id]/members/[userId] - Update member role (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId, userId: targetUserId } = await params
    const { role } = await request.json()

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const ctx = await getGroupContext(groupId, session.user.id, targetUserId)

    if (!ctx.isAdmin) {
      return NextResponse.json({ error: 'Only admins can update roles' }, { status: 403 })
    }

    if (ctx.targetIsCreator) {
      return NextResponse.json({ error: "Cannot change creator's role" }, { status: 403 })
    }

    if (!ctx.targetRole) {
      return NextResponse.json({ error: 'User is not a member' }, { status: 404 })
    }

    const updatedMember = await prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    })

    return NextResponse.json({
      id: updatedMember.user.id,
      name: updatedMember.user.name,
      image: updatedMember.user.image,
      role: updatedMember.role,
    })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

// DELETE /api/groups/[id]/members/[userId] - Remove member or leave group
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId, userId: targetUserId } = await params
    const ctx = await getGroupContext(groupId, session.user.id, targetUserId)

    // Self-removal (leaving the group)
    if (ctx.isSelf) {
      if (ctx.isCreator) {
        return NextResponse.json(
          { error: 'Creator cannot leave. Transfer ownership or delete the group.' },
          { status: 403 }
        )
      }

      await prisma.groupMember.delete({
        where: { groupId_userId: { groupId, userId: targetUserId } },
      })

      return NextResponse.json({ success: true, action: 'left' })
    }

    // Removing someone else (admin only)
    if (!ctx.isAdmin) {
      return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 })
    }

    if (ctx.targetIsCreator) {
      return NextResponse.json({ error: 'Cannot remove the group creator' }, { status: 403 })
    }

    if (!ctx.targetRole) {
      return NextResponse.json({ error: 'User is not a member' }, { status: 404 })
    }

    // Admin can only remove non-admins, or creator can remove anyone
    if (ctx.targetRole === 'admin' && !ctx.isCreator) {
      return NextResponse.json({ error: 'Only creator can remove admins' }, { status: 403 })
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    })

    return NextResponse.json({ success: true, action: 'removed' })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}

