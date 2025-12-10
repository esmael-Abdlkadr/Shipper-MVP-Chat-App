import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ id: string }> }

// Helper to check if user is admin
async function isAdmin(groupId: string, userId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  })
  return member?.role === 'admin'
}

// GET /api/groups/[id]/members - List all members
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

    const members = await prisma.groupMember.findMany({
      where: { groupId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    })

    const group = await prisma.group.findUnique({
      where: { id },
      select: { creatorId: true },
    })

    return NextResponse.json(
      members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        isOnline: m.user.isOnline,
        lastSeen: m.user.lastSeen,
        role: m.role,
        isCreator: m.user.id === group?.creatorId,
        joinedAt: m.joinedAt,
      }))
    )
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

// POST /api/groups/[id]/members - Add member(s) (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user is admin
    if (!(await isAdmin(id, session.user.id))) {
      return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 })
    }

    const { userIds } = await request.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 })
    }

    // Check group member limit
    const group = await prisma.group.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const newTotal = group._count.members + userIds.length
    if (newTotal > group.maxMembers) {
      return NextResponse.json(
        { error: `Group cannot exceed ${group.maxMembers} members` },
        { status: 400 }
      )
    }

    // Add members (skip if already exists)
    const addedMembers = await Promise.all(
      userIds.map(async (userId: string) => {
        try {
          return await prisma.groupMember.create({
            data: {
              groupId: id,
              userId,
              role: 'member',
            },
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
            },
          })
        } catch {
          // Member already exists, skip
          return null
        }
      })
    )

    const successfullyAdded = addedMembers.filter(Boolean)

    return NextResponse.json({
      added: successfullyAdded.length,
      members: successfullyAdded.map((m) => ({
        id: m?.user.id,
        name: m?.user.name,
        image: m?.user.image,
        role: m?.role,
      })),
    })
  } catch (error) {
    console.error('Error adding members:', error)
    return NextResponse.json({ error: 'Failed to add members' }, { status: 500 })
  }
}

