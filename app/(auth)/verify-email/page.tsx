'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link')
      return
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await res.json()

        if (!res.ok) {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
          return
        }

        setStatus('success')
        setMessage(data.message)
      } catch {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    verifyEmail()
  }, [token])

  if (status === 'loading') {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <Loader2 className="w-12 h-12 text-zinc-400 animate-spin" />
            <h2 className="text-xl font-semibold">Verifying your email...</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Please wait while we verify your email address.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold">Verification failed</h2>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-sm">{message}</p>
            <Link href="/register">
              <Button variant="outline" className="mt-4">
                Try registering again
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold">Email verified!</h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-sm">{message}</p>
          <Link href="/login">
            <Button className="mt-4">Go to login</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function VerifyEmailLoading() {
  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  )
}

