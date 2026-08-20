import type {AssistantMode, ChatMessage} from '@/lib/types'

export class AssistantError extends Error {
  code: string
  status: number
  constructor(code: string, status: number) {
    super(code)
    this.code = code
    this.status = status
  }
}

export type AssistantPayload = {
  mode: AssistantMode
  locale: string
  advert?: string
  question?: string
  history?: ChatMessage[]
  markedIds?: string[]
}

type StreamOptions = {
  /** Called with the full accumulated text each time more arrives. */
  onDelta: (full: string) => void
  signal?: AbortSignal
}

/**
 * POSTs to the assistant route and consumes the plain-text stream. Returns the
 * model name (from the response header) once the stream ends. Throws
 * AssistantError with the server's error code on a non-OK response.
 */
export async function streamAssistant(
  payload: AssistantPayload,
  {onDelta, signal}: StreamOptions
): Promise<{model: string | null}> {
  const response = await fetch('/api/assistant', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
    signal,
  })

  if (!response.ok || !response.body) {
    let code = 'generic'
    try {
      const data = await response.json()
      if (typeof data?.error === 'string') code = data.error
    } catch {
      // no JSON body — keep the generic code
    }
    throw new AssistantError(code, response.status)
  }

  const model = response.headers.get('X-Assistant-Model')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  for (;;) {
    const {value, done} = await reader.read()
    if (done) break
    full += decoder.decode(value, {stream: true})
    onDelta(full)
  }

  return {model}
}
