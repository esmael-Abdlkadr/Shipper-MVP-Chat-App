'use client'

import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { Skeleton } from '@/components/ui/skeleton'

function ResetPasswordLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-64 mx-auto" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

