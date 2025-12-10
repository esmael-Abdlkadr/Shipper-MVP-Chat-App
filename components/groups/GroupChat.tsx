'use client'

import { useRef, useEffect } from 'react'
import { Users, Bot, Loader2 } from 'lucide-react'
import { GroupMessage } from './GroupMessage'
import { GroupInput } from './GroupInput'
import { GroupMessage as GroupMessageType, GroupDetails } from '@/stores/useGroupStore'

interface GroupChatProps {
  group: GroupDetails
  messages: GroupMessageType[]
  currentUserId: string
  isLoading: boolean
  aiTyping: boolean
  streamingContent: string
  replyingTo: GroupMessageType | null
  editingMessage: GroupMessageType | null
  onSendMessage: (content: string, replyToId?: string) => void
  onEditMessage: (messageId: string, content: string) => void
  onReply: (message: GroupMessageType) => void
  onCancelReply: () => void
  onEdit: (message: GroupMessageType) => void
  onCancelEdit: () => void
  onDeleteForMe: (messageId: string) => void
  onDeleteForAll: (messageId: string) => void
}

export function GroupChat({
  group,
  messages,
  currentUserId,
  isLoading,
  aiTyping,
  streamingContent,
  replyingTo,
  editingMessage,
  onSendMessage,
  onEditMessage,
  onReply,
  onCancelReply,
  onEdit,
  onCancelEdit,
  onDeleteForMe,
  onDeleteForAll,
}: GroupChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const getMemberInfo = (senderId: string | null) => {
    if (!senderId) return { isAdmin: false, isCreator: false }
    const member = group.members.find((m) => m.id === senderId)
    return {
      isAdmin: member?.role === 'admin',
      isCreator: member?.isCreator || false,
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Welcome to {group.name}!</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Start the conversation! 
              {group.aiEnabled && (
                <span className="block mt-2">
                  <Bot className="h-4 w-4 inline mr-1" />
                  Type <span className="font-mono bg-muted px-1 rounded">@shipper</span> to chat with AI
                </span>
              )}
            </p>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg) => {
              const memberInfo = getMemberInfo(msg.senderId)
              return (
                <GroupMessage
                  key={msg.id}
                  id={msg.id}
                  content={msg.content}
                  senderName={msg.senderName}
                  senderImage={msg.senderImage}
                  isAI={msg.isAI}
                  isOwn={msg.senderId === currentUserId}
                  isAdmin={memberInfo.isAdmin}
                  isCreator={memberInfo.isCreator}
                  createdAt={msg.createdAt}
                  editedAt={msg.editedAt}
                  isDeleted={msg.isDeleted}
                  replyTo={msg.replyTo}
                  onReply={() => onReply(msg)}
                  onEdit={() => onEdit(msg)}
                  onDeleteForMe={() => onDeleteForMe(msg.id)}
                  onDeleteForAll={() => onDeleteForAll(msg.id)}
                />
              )
            })}

            {aiTyping && streamingContent && (
              <GroupMessage
                id="streaming"
                content={streamingContent}
                senderName="Shipper"
                senderImage={null}
                isAI={true}
                isOwn={false}
                createdAt={new Date()}
                isStreaming={true}
              />
            )}

            {aiTyping && !streamingContent && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                <Bot className="h-4 w-4 text-blue-500" />
                <span>Shipper is typing</span>
                <Loader2 className="h-3 w-3 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      <GroupInput
        onSend={onSendMessage}
        onEditMessage={onEditMessage}
        disabled={isLoading}
        aiEnabled={group.aiEnabled}
        placeholder={`Message ${group.name}`}
        replyingTo={replyingTo}
        editingMessage={editingMessage}
        onCancelReply={onCancelReply}
        onCancelEdit={onCancelEdit}
      />
    </div>
  )
}
