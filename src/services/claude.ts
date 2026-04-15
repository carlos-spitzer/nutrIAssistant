import Anthropic from '@anthropic-ai/sdk'
import { fetch } from 'expo/fetch'
import { AIMessage } from '../types/ai'

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
  // expo/fetch supports streaming, required in React Native
  fetch: fetch as unknown as typeof globalThis.fetch,
  dangerouslyAllowBrowser: true,
})

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 4096

export interface StreamCallback {
  onDelta: (text: string) => void
  onComplete: (fullText: string) => void
  onError: (error: Error) => void
}

function convertMessages(messages: AIMessage[]): Anthropic.MessageParam[] {
  return messages.map((m) => {
    if (m.imageUri) {
      return {
        role: m.role,
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: m.imageUri } },
          { type: 'text', text: m.content },
        ],
      } as Anthropic.MessageParam
    }
    return { role: m.role, content: m.content }
  })
}

export async function streamCompletion(
  messages: AIMessage[],
  systemPrompt: string,
  callbacks: StreamCallback
): Promise<void> {
  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: convertMessages(messages),
    })

    let fullText = ''

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        fullText += event.delta.text
        callbacks.onDelta(event.delta.text)
      }
    }

    callbacks.onComplete(fullText)
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)))
  }
}

export async function complete(
  messages: AIMessage[],
  systemPrompt: string
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: convertMessages(messages),
  })

  const content = response.content[0]
  return content.type === 'text' ? content.text : ''
}

export async function analyzeImage(
  imageBase64: string,
  prompt: string,
  systemPrompt: string
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  })

  const content = response.content[0]
  return content.type === 'text' ? content.text : ''
}

export async function analyzePDF(
  pdfBase64: string,
  prompt: string
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          } as unknown as Anthropic.TextBlockParam,
          { type: 'text', text: prompt },
        ],
      },
    ],
  })

  const content = response.content[0]
  return content.type === 'text' ? content.text : ''
}

export async function checkConnectivity(): Promise<boolean> {
  try {
    await client.messages.create({
      model: MODEL,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    })
    return true
  } catch {
    return false
  }
}
