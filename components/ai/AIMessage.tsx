'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Ship, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AIMessageProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export function AIMessage({ role, content, isStreaming }: AIMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = role === 'user'

  return (
    <div className={cn('group py-6', isUser ? 'bg-transparent' : 'bg-muted/30')}>
      <div className="max-w-3xl mx-auto px-4 flex gap-4">
        <div
          className={cn(
            'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-cyan-500 to-blue-600'
          )}
        >
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Ship className="h-4 w-4 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {isUser ? 'You' : 'Shipper'}
            </span>
            {!isUser && !isStreaming && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            {isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const isInline = !match
                    
                    if (isInline) {
                      return (
                        <code
                          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      )
                    }

                    return (
                      <div className="relative group/code">
                        <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                          <CopyButton text={String(children).replace(/\n$/, '')} />
                        </div>
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg !mt-0"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    )
                  },
                  p({ children }) {
                    return <p className="mb-4 last:mb-0">{children}</p>
                  },
                  ul({ children }) {
                    return <ul className="list-disc pl-6 mb-4">{children}</ul>
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-6 mb-4">{children}</ol>
                  },
                  li({ children }) {
                    return <li className="mb-1">{children}</li>
                  },
                  h1({ children }) {
                    return <h1 className="text-xl font-bold mb-4">{children}</h1>
                  },
                  h2({ children }) {
                    return <h2 className="text-lg font-bold mb-3">{children}</h2>
                  },
                  h3({ children }) {
                    return <h3 className="text-base font-bold mb-2">{children}</h3>
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            )}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 bg-background/80 hover:bg-background"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

