import { MessageCircle } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-zinc-100 dark:text-zinc-900" />
          </div>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Shipper Chat
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

