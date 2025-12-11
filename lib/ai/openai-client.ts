import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

export const openai = new Proxy({} as OpenAI, {
  get(_, prop) {
    return getOpenAI()[prop as keyof OpenAI]
  },
})
