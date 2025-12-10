import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { Loader2 } from 'lucide-react'

function LoginFormFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  )
}
