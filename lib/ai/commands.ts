import { ModelId } from './config'

export type ShipperCommand =
  | { type: 'tasks'; filter?: { assignee?: string; status?: string } }
  | { type: 'done'; taskRef?: string }
  | { type: 'assign'; assignee: string; description: string }
  | { type: 'summarize'; period: 'today' | 'week' | 'month' }
  | { type: 'chat'; model: ModelId }

export function parseShipperCommand(message: string): ShipperCommand | null {
  const lower = message.toLowerCase().trim()

  // @shipper:tasks [@user] [status]
  const tasksMatch = lower.match(/@shipper:tasks\s*(@\w+)?\s*(pending|in_progress|done)?/i)
  if (tasksMatch) {
    return {
      type: 'tasks',
      filter: {
        assignee: tasksMatch[1]?.slice(1),
        status: tasksMatch[2],
      },
    }
  }

  // @shipper:done [task reference]
  const doneMatch = message.match(/@shipper:done\s*(.*)?/i)
  if (doneMatch) {
    return {
      type: 'done',
      taskRef: doneMatch[1]?.trim() || undefined,
    }
  }

  // @shipper:assign @user description
  const assignMatch = message.match(/@shipper:assign\s+@(\w+)\s+(.+)/i)
  if (assignMatch) {
    return {
      type: 'assign',
      assignee: assignMatch[1],
      description: assignMatch[2].trim(),
    }
  }

  // @shipper:summarize [period]
  const summarizeMatch = lower.match(/@shipper:summarize\s*(today|week|month)?/i)
  if (summarizeMatch) {
    const period = (summarizeMatch[1] as 'today' | 'week' | 'month') || 'today'
    return {
      type: 'summarize',
      period,
    }
  }

  // @shipper:gemini or @shipper:openai or @shipper:gpt (model selection)
  if (/@shipper:(gemini|openai|gpt)/i.test(message)) {
    const model: ModelId = /@shipper:(openai|gpt)/i.test(message) ? 'openai' : 'gemini'
    return { type: 'chat', model }
  }

  // Plain @shipper (default chat)
  if (/@shipper\b/i.test(message) && !/@shipper:/i.test(message)) {
    return { type: 'chat', model: 'gemini' }
  }

  return null
}

export function isTaskCommand(message: string): boolean {
  return /@shipper:(tasks|done|assign|summarize)/i.test(message)
}

export function containsShipperMention(message: string): boolean {
  return /@shipper/i.test(message)
}

