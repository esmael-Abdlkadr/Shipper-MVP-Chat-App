import { ai } from './client'
import { openai } from './openai-client'
import { AI_MODELS, ModelId, DEFAULT_MODEL as CONFIG_DEFAULT_MODEL } from './config'

export const DEFAULT_MODEL = CONFIG_DEFAULT_MODEL

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface GenerateOptions {
  systemPrompt: string
  history: ChatMessage[]
  userMessage: string
}

/**
 * Generate streaming response using Gemini
 */
export async function* generateWithGemini(
  options: GenerateOptions
): AsyncGenerator<string> {
  const { systemPrompt, history, userMessage } = options

  // Convert to Gemini format
  const geminiHistory = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : ('user' as const),
    parts: [{ text: m.content }],
  }))

  geminiHistory.push({
    role: 'user',
    parts: [{ text: userMessage }],
  })

  const response = await ai.models.generateContentStream({
    model: AI_MODELS.gemini.modelId,
    contents: geminiHistory,
    config: {
      systemInstruction: systemPrompt,
    },
  })

  for await (const chunk of response) {
    const text = chunk.text || ''
    if (text) {
      yield text
    }
  }
}

/**
 * Generate streaming response using OpenAI
 */
export async function* generateWithOpenAI(
  options: GenerateOptions
): AsyncGenerator<string> {
  const { systemPrompt, history, userMessage } = options

  // Convert to OpenAI format
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ]

  const stream = await openai.chat.completions.create({
    model: AI_MODELS.openai.modelId,
    messages,
    stream: true,
  })

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || ''
    if (text) {
      yield text
    }
  }
}

/**
 * Get the appropriate AI generator based on model ID
 */
export function getAIProvider(modelId: ModelId = CONFIG_DEFAULT_MODEL) {
  switch (modelId) {
    case 'openai':
      return generateWithOpenAI
    case 'gemini':
    default:
      return generateWithGemini
  }
}

/**
 * Resolve which model to use based on priority:
 * 1. Explicit model parameter
 * 2. Conversation's model
 * 3. User's preferred model
 * 4. Default model (gemini)
 */
export function resolveModel(
  explicitModel?: string | null,
  conversationModel?: string | null,
  userPreferredModel?: string | null
): ModelId {
  const model = explicitModel || conversationModel || userPreferredModel || CONFIG_DEFAULT_MODEL
  
  // Validate it's a known model
  if (model === 'gemini' || model === 'openai') {
    return model
  }
  
  return CONFIG_DEFAULT_MODEL
}

/**
 * Parse model from @shipper mention (for group chats)
 * Examples:
 * - "@shipper" -> "gemini" (default)
 * - "@shipper:openai" or "@shipper:gpt" -> "openai"
 * - "@shipper:gemini" -> "gemini"
 */
export function parseModelFromMention(text: string): ModelId {
  const openaiPatterns = [/@shipper:openai/i, /@shipper:gpt/i, /@shipper:gpt-4o?/i]
  const geminiPatterns = [/@shipper:gemini/i]
  
  for (const pattern of openaiPatterns) {
    if (pattern.test(text)) {
      return 'openai'
    }
  }
  
  for (const pattern of geminiPatterns) {
    if (pattern.test(text)) {
      return 'gemini'
    }
  }
  
  return CONFIG_DEFAULT_MODEL
}

/**
 * Check if a message contains @shipper mention
 */
export function containsShipperMention(text: string): boolean {
  return /@shipper/i.test(text)
}

/**
 * Clean @shipper mention from text (remove the :model part for display)
 */
export function cleanShipperMention(text: string): string {
  return text.replace(/@shipper:(openai|gpt|gemini|gpt-4o?)/gi, '@shipper')
}

