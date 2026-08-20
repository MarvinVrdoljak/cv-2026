/** Shared contracts between the API route and the client. */

export type AssistantMode = 'matching' | 'chat' | 'summary'

export type StreamState = 'idle' | 'streaming' | 'done' | 'error'

/** The three matching buckets, in the order the brief prescribes. */
export type MatchBucket = 'fit' | 'partial' | 'gap'

export type MatchFinding = {
  bucket: MatchBucket
  text: string
  /** CV entry ids this point rests on. May be empty for a pure gap. */
  refs: string[]
}

export type MatchResult = {
  /** Experience ids, most relevant first — drives the reordering. */
  order: string[]
  findings: MatchFinding[]
  /** Set when the model declined (not a job ad / off-topic / prompt probing). */
  rejected: string | null
}

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

/** One NDJSON line of the matching stream. */
export type MatchLine =
  | {type: 'order'; ids: string[]}
  | {type: 'finding'; bucket: MatchBucket; text: string; refs?: string[]}
  | {type: 'reject'; text: string}

export type AssistantErrorCode = 'not_configured' | 'rate_limited' | 'too_long' | 'bad_request'
