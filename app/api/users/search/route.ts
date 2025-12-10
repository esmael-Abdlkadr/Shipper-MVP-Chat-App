import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/users/search?q=query&groupId=optional
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.trim()
    const groupId = searchParams.get('groupId')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 })
    }

    // If groupId provided, exclude users already in that group
    let excludeUserIds: string[] = [session.user.id]

    if (groupId) {
      const existingMembers = await prisma.groupMember.findMany({
        where: { groupId },
        select: { userId: true },
      })
      excludeUserIds = [...excludeUserIds, ...existingMembers.map((m) => m.userId)]
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { notIn: excludeUserIds } },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isOnline: true,
      },
      take: limit,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
  }
}

