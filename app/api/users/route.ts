import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      where: { id: { not: session.user.id } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isOnline: true,
        lastSeen: true,
      },
      orderBy: [{ isOnline: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

