import {cookies} from 'next/headers'
import {hasLocale} from 'next-intl'
import {routing, type Locale} from '@/i18n/routing'
import {getOpenAI, MODEL, mockEnabled} from '@/lib/openai'
import {mockScript} from '@/lib/mockStream'
import {checkRateLimit, MAX_LENGTH} from '@/lib/rateLimit'
import {matchingSystemPrompt, chatSystemPrompt, summarySystemPrompt} from '@/lib/prompts'
import {collectValidIds} from '@/lib/cvContext'
import type {AssistantMode, ChatMessage} from '@/lib/types'

// The OpenAI key must stay server-side; this route is the only thing that
// touches it. Node runtime (default) — streaming works without the edge.
export const runtime = 'nodejs'

const SESSION_COOKIE = 'cv_sid'

function jsonError(code: string, status: number) {
  return Response.json({error: code}, {status})
}

type Payload = {
  mode?: AssistantMode
  locale?: string
  advert?: string
  question?: string
  history?: ChatMessage[]
  markedIds?: string[]
}

export async function POST(request: Request) {
  let body: Payload
  try {
    body = (await request.json()) as Payload
  } catch {
    return jsonError('bad_request', 400)
  }

  const mode = body.mode
  if (mode !== 'matching' && mode !== 'chat' && mode !== 'summary') {
    return jsonError('bad_request', 400)
  }

  const locale: Locale = hasLocale(routing.locales, body.locale)
    ? (body.locale as Locale)
    : routing.defaultLocale

  // Session id from cookie, minted on first request.
  const jar = await cookies()
  let sessionId = jar.get(SESSION_COOKIE)?.value
  const freshSession = !sessionId
  if (!sessionId) sessionId = crypto.randomUUID()

  const verdict = checkRateLimit(sessionId)
  if (!verdict.ok) {
    return jsonError('rate_limited', 429)
  }

  // Build the model messages per mode, validating input length as we go.
  let system: string
  const messages: {role: 'system' | 'user' | 'assistant'; content: string}[] = []

  if (mode === 'matching') {
    const advert = (body.advert ?? '').trim()
    if (!advert) return jsonError('bad_request', 400)
    if (advert.length > MAX_LENGTH.advert) return jsonError('too_long', 413)
    system = matchingSystemPrompt(locale)
    messages.push({role: 'system', content: system})
    messages.push({role: 'user', content: advert})
  } else if (mode === 'chat') {
    const question = (body.question ?? '').trim()
    if (!question) return jsonError('bad_request', 400)
    if (question.length > MAX_LENGTH.question) return jsonError('too_long', 413)
    const advert = body.advert?.trim() ? body.advert.trim().slice(0, MAX_LENGTH.advert) : null
    system = chatSystemPrompt(locale, advert)
    messages.push({role: 'system', content: system})
    // A short slice of prior turns keeps the thread coherent without unbounded growth.
    for (const turn of (body.history ?? []).slice(-6)) {
      if (turn.role === 'user' || turn.role === 'assistant') {
        messages.push({role: turn.role, content: turn.content.slice(0, MAX_LENGTH.advert)})
      }
    }
    messages.push({role: 'user', content: question})
  } else {
    const valid = new Set(collectValidIds())
    const markedIds = (body.markedIds ?? []).filter((id) => valid.has(id))
    if (markedIds.length === 0) return jsonError('bad_request', 400)
    system = summarySystemPrompt(locale, markedIds)
    messages.push({role: 'system', content: system})
    messages.push({
      role: 'user',
      content: locale === 'de' ? 'Erzeuge die Einordnung.' : 'Produce the assessment.',
    })
  }

  const headers = new Headers({
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Assistant-Model': mockEnabled() ? 'dev-mock' : MODEL,
  })
  if (freshSession) {
    headers.append(
      'Set-Cookie',
      `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    )
  }

  // Dev mock: scripted, clearly-labelled stream, no key needed.
  if (mockEnabled()) {
    const lines = mockScript(mode)
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder()
        for (const line of lines) {
          // Matching is line-delimited NDJSON; chat/summary is plain prose.
          controller.enqueue(encoder.encode(mode === 'matching' ? line + '\n' : line))
          await new Promise((resolve) => setTimeout(resolve, 220))
        }
        controller.close()
      },
    })
    return new Response(stream, {headers})
  }

  const openai = getOpenAI()
  if (!openai) return jsonError('not_configured', 503)

  let completion
  try {
    completion = await openai.chat.completions.create({
      model: MODEL,
      messages,
      stream: true,
      temperature: mode === 'matching' ? 0.2 : 0.4,
      max_tokens: mode === 'chat' ? 400 : 700,
    })
  } catch {
    return jsonError('upstream', 502)
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) controller.enqueue(encoder.encode(delta))
        }
      } catch {
        // Client aborted or upstream dropped — end the stream quietly.
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {headers})
}
