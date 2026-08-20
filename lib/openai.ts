import OpenAI from 'openai'

/**
 * Model selection. `OPENAI_MODEL` always wins, so any environment can pin a
 * specific model. Without it, the default follows the environment: production
 * gets `gpt-4o` — its stronger paraphrase reasoning is what keeps the matching
 * honest without turning cautious — while development stays on the fast, cheap
 * `gpt-4o-mini` for zero-cost iteration.
 */
export const MODEL =
  process.env.OPENAI_MODEL ?? (process.env.NODE_ENV === 'production' ? 'gpt-4o' : 'gpt-4o-mini')

let client: OpenAI | null = null

/** Null when no key is configured — the route turns that into a 503. */
export function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  if (!client) client = new OpenAI({apiKey})
  return client
}

/**
 * Dev-only scripted stream, active when there is no API key AND
 * ASSISTANT_MOCK=1. It lets the interaction layer be exercised without a key
 * or spend. Every line is prefixed so it can never be mistaken for a real
 * assessment. Off in production regardless of the flag.
 */
export function mockEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.ASSISTANT_MOCK === '1' &&
    !process.env.OPENAI_API_KEY
  )
}
