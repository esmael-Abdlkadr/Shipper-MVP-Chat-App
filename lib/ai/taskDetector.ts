import { getAIProvider } from './providers'
import { ModelId } from './config'

export interface DetectedTask {
  isTask: boolean
  assignee: 'sender' | string
  description: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  dueDate?: string
}

const TASK_DETECTION_PROMPT = `You are a task detector. Analyze the message and determine if it contains a task commitment or assignment.

DETECT TASKS WHEN:
- Someone says "I'll...", "I will...", "I'm going to...", "Let me..."
- Someone assigns with "@name please...", "@name can you..."
- Clear action items like "Need to...", "Have to...", "Should..."

DO NOT detect as tasks:
- Questions or discussions
- Past tense statements
- General statements without action

Return ONLY valid JSON (no markdown):
{"isTask": boolean, "assignee": "sender" or "@username", "description": "short task description", "priority": "normal", "dueDate": null or "tomorrow/today/etc"}

Examples:
Message: "I'll fix the login bug tomorrow"
{"isTask": true, "assignee": "sender", "description": "Fix the login bug", "priority": "normal", "dueDate": "tomorrow"}

Message: "@sarah please review the PR"
{"isTask": true, "assignee": "@sarah", "description": "Review the PR", "priority": "normal", "dueDate": null}

Message: "The weather is nice today"
{"isTask": false, "assignee": "sender", "description": "", "priority": "normal", "dueDate": null}

Message: "Did you finish the report?"
{"isTask": false, "assignee": "sender", "description": "", "priority": "normal", "dueDate": null}

Now analyze this message:`

export async function detectTask(
  message: string,
  model: ModelId = 'gemini'
): Promise<DetectedTask> {
  try {
    const generateResponse = getAIProvider(model)
    
    let fullResponse = ''
    for await (const text of generateResponse({
      systemPrompt: TASK_DETECTION_PROMPT,
      history: [],
      userMessage: message,
    })) {
      fullResponse += text
    }

    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { isTask: false, assignee: 'sender', description: '', priority: 'normal' }
    }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      isTask: Boolean(parsed.isTask),
      assignee: parsed.assignee || 'sender',
      description: parsed.description || '',
      priority: parsed.priority || 'normal',
      dueDate: parsed.dueDate || undefined,
    }
  } catch {
    return { isTask: false, assignee: 'sender', description: '', priority: 'normal' }
  }
}

export function parseDueDate(dueDateStr?: string): Date | null {
  if (!dueDateStr) return null
  
  const now = new Date()
  const lower = dueDateStr.toLowerCase()
  
  if (lower === 'today') {
    now.setHours(23, 59, 59, 999)
    return now
  }
  
  if (lower === 'tomorrow') {
    now.setDate(now.getDate() + 1)
    now.setHours(23, 59, 59, 999)
    return now
  }
  
  if (lower.includes('week')) {
    now.setDate(now.getDate() + 7)
    return now
  }
  
  return null
}

