/**
 * Session-scoped rate limiting: a short sliding window against bursts and a
 * hard daily cap against sustained draining of the API budget. In-memory —
 * fine for a single-instance deployment; swap for a shared store if this ever
 * runs on more than one instance.
 */

type Bucket = {
  windowStart: number
  windowCount: number
  day: string
  dayCount: number
}

const buckets = new Map<string, Bucket>()

export const LIMITS = {
  windowMs: 60_000,
  perWindow: 8,
  perDay: 40,
} as const

/** Advert stays generous (a full job ad, or a whole fetched page, is long);
    chat/question is tight. */
export const MAX_LENGTH = {
  advert: 10000,
  question: 500,
  /** The assessment the client sends back to be typeset — the model is capped
      at 700 tokens, so anything beyond this is not something we wrote. */
  assessment: 4000,
} as const

function today(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

export type RateVerdict = {ok: true} | {ok: false; retryable: boolean}

export function checkRateLimit(sessionId: string, now = Date.now()): RateVerdict {
  const day = today(now)
  const existing = buckets.get(sessionId)

  const bucket: Bucket = existing ?? {
    windowStart: now,
    windowCount: 0,
    day,
    dayCount: 0,
  }

  // Roll the day over at UTC midnight.
  if (bucket.day !== day) {
    bucket.day = day
    bucket.dayCount = 0
  }

  // Roll the sliding window.
  if (now - bucket.windowStart >= LIMITS.windowMs) {
    bucket.windowStart = now
    bucket.windowCount = 0
  }

  if (bucket.dayCount >= LIMITS.perDay) {
    buckets.set(sessionId, bucket)
    return {ok: false, retryable: false}
  }

  if (bucket.windowCount >= LIMITS.perWindow) {
    buckets.set(sessionId, bucket)
    return {ok: false, retryable: true}
  }

  bucket.windowCount += 1
  bucket.dayCount += 1
  buckets.set(sessionId, bucket)
  return {ok: true}
}

/**
 * Rendering a PDF costs no API budget but does cost CPU, so it gets its own
 * bucket: a session may pull a document as often as is plausible for a person
 * clicking a button, and no more. Deliberately not the bucket above — a
 * download must never eat into the day's model calls.
 */
const renders = new Map<string, {windowStart: number; count: number}>()

export const RENDER_LIMITS = {
  windowMs: 60_000,
  perWindow: 12,
} as const

export function checkRenderLimit(sessionId: string, now = Date.now()): boolean {
  const bucket = renders.get(sessionId) ?? {windowStart: now, count: 0}

  if (now - bucket.windowStart >= RENDER_LIMITS.windowMs) {
    bucket.windowStart = now
    bucket.count = 0
  }
  if (bucket.count >= RENDER_LIMITS.perWindow) {
    renders.set(sessionId, bucket)
    return false
  }

  bucket.count += 1
  renders.set(sessionId, bucket)
  return true
}
