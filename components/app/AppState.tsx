'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {useTranslations} from 'next-intl'
import type {Locale} from '@/i18n/routing'
import type {ChatMessage, MatchFinding, MatchLine, StreamState} from '@/lib/types'
import {AssistantError, streamAssistant} from '@/lib/streamAssistant'
import {
  applyHighlight,
  clearExperienceOrder,
  readMarkedIds,
  reorderExperience,
  scrollToEntry,
} from '@/lib/dom'

type MatchingState = {
  state: StreamState
  findings: MatchFinding[]
  order: string[]
  rejected: string | null
  advert: string
}

type SummaryState = {
  state: StreamState
  text: string
  open: boolean
  ids: string[]
}

type AppStateValue = {
  // Highlighting (hover + click), driven by matching and chat references.
  setHover: (ids: string[]) => void
  clearHover: () => void
  focusEntry: (id: string) => void

  matching: MatchingState
  runMatching: (advert: string) => void
  resetMatching: () => void

  chat: {state: StreamState; messages: ChatMessage[]}
  runChat: (question: string) => void
  clearChat: () => void

  summary: SummaryState
  runSummary: () => void
  closeSummary: () => void

  status: {state: StreamState; model: string | null; latencyMs: number | null}
  error: string | null
  dismissError: () => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext)
  if (!value) throw new Error('useAppState must be used within <AppState>')
  return value
}

const STORE_KEY = 'cv:v1'
const FLASH_MS = 1400

function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** Parses whatever complete NDJSON lines exist in the accumulated text. */
function parseMatchLines(full: string): MatchLine[] {
  const lines = full.split('\n')
  // The last element may be a partial line still streaming — drop it unless
  // the text ended on a newline.
  const complete = full.endsWith('\n') ? lines : lines.slice(0, -1)
  const parsed: MatchLine[] = []
  for (const line of complete) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      parsed.push(JSON.parse(trimmed) as MatchLine)
    } catch {
      // Ignore a malformed line rather than breaking the whole result.
    }
  }
  return parsed
}

type AppStateProps = {
  locale: Locale
  children: React.ReactNode
}

export function AppState({locale, children}: AppStateProps) {
  const t = useTranslations('errors')

  const [matching, setMatching] = useState<MatchingState>({
    state: 'idle',
    findings: [],
    order: [],
    rejected: null,
    advert: '',
  })
  const [chat, setChat] = useState<{state: StreamState; messages: ChatMessage[]}>({
    state: 'idle',
    messages: [],
  })
  const [summary, setSummary] = useState<SummaryState>({
    state: 'idle',
    text: '',
    open: false,
    ids: [],
  })
  const [status, setStatus] = useState<AppStateValue['status']>({
    state: 'idle',
    model: null,
    latencyMs: null,
  })
  const [error, setError] = useState<string | null>(null)

  const [hoverIds, setHoverIds] = useState<string[]>([])
  const [flashIds, setFlashIds] = useState<string[]>([])
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Abort controllers so a new request cancels the one in flight per feature.
  const matchAbort = useRef<AbortController | null>(null)
  const chatAbort = useRef<AbortController | null>(null)
  const summaryAbort = useRef<AbortController | null>(null)

  const toError = useCallback(
    (err: unknown): string => {
      if (err instanceof AssistantError) {
        if (err.code === 'not_configured') return t('not_configured')
        if (err.code === 'rate_limited') return t('rate_limited')
        if (err.code === 'too_long') return t('too_long')
      }
      return t('generic')
    },
    [t]
  )

  // ---- Rehydrate chat + advert from a prior session (survives reload) ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as {messages?: ChatMessage[]; advert?: string}
      if (saved.messages?.length) {
        setChat({state: 'idle', messages: saved.messages})
      }
      if (saved.advert) {
        setMatching((m) => ({...m, advert: saved.advert as string}))
      }
    } catch {
      // corrupt store — ignore
    }
  }, [])

  // Persist the durable slice.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({messages: chat.messages, advert: matching.advert})
      )
    } catch {
      // storage full / unavailable — non-fatal
    }
  }, [chat.messages, matching.advert])

  // ---- Highlight effect: reflect hover + flash onto the document ----
  useEffect(() => {
    applyHighlight(new Set([...hoverIds, ...flashIds]))
  }, [hoverIds, flashIds])

  // ---- Reorder effect: whenever the ranking changes, FLIP the entries ----
  useEffect(() => {
    if (matching.order.length > 0) reorderExperience(matching.order)
  }, [matching.order])

  // Clean up timers/requests on unmount.
  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
      matchAbort.current?.abort()
      chatAbort.current?.abort()
      summaryAbort.current?.abort()
    }
  }, [])

  const setHover = useCallback((ids: string[]) => setHoverIds(ids), [])
  const clearHover = useCallback(() => setHoverIds([]), [])

  const focusEntry = useCallback((id: string) => {
    scrollToEntry(id)
    setFlashIds([id])
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlashIds([]), FLASH_MS)
  }, [])

  const runMatching = useCallback(
    (advert: string) => {
      const trimmed = advert.trim()
      if (!trimmed) return

      matchAbort.current?.abort()
      const controller = new AbortController()
      matchAbort.current = controller
      clearExperienceOrder()

      setError(null)
      setMatching({state: 'streaming', findings: [], order: [], rejected: null, advert: trimmed})
      setStatus((s) => ({...s, state: 'streaming'}))
      const started = performance.now()

      streamAssistant(
        {mode: 'matching', locale, advert: trimmed},
        {
          signal: controller.signal,
          onDelta: (full) => {
            const lines = parseMatchLines(full)
            const order = (
              lines.find((l) => l.type === 'order') as
                Extract<MatchLine, {type: 'order'}> | undefined
            )?.ids
            const reject = lines.find((l) => l.type === 'reject') as
              Extract<MatchLine, {type: 'reject'}> | undefined
            const findings = lines
              .filter((l): l is Extract<MatchLine, {type: 'finding'}> => l.type === 'finding')
              .map((l) => ({
                bucket: l.bucket,
                text: l.text,
                // Keep only real, addressable entry ids — the model sometimes
                // emits things like "about" that point to nothing renderable.
                refs: (l.refs ?? []).filter((id) => /^[a-z]{3}-\d{2}$/.test(id)),
              }))

            setMatching((m) => ({
              ...m,
              findings,
              order: order ?? m.order,
              rejected: reject?.text ?? null,
            }))
          },
        }
      )
        .then(({model}) => {
          setMatching((m) => ({...m, state: 'done'}))
          setStatus({state: 'done', model, latencyMs: Math.round(performance.now() - started)})
        })
        .catch((err) => {
          if (controller.signal.aborted) return
          setMatching((m) => ({...m, state: 'error'}))
          setStatus((s) => ({...s, state: 'idle'}))
          setError(toError(err))
        })
    },
    [locale, toError]
  )

  const resetMatching = useCallback(() => {
    matchAbort.current?.abort()
    clearExperienceOrder()
    setMatching({state: 'idle', findings: [], order: [], rejected: null, advert: ''})
  }, [])

  const runChat = useCallback(
    (question: string) => {
      const trimmed = question.trim()
      if (!trimmed) return

      chatAbort.current?.abort()
      const controller = new AbortController()
      chatAbort.current = controller

      const userMessage: ChatMessage = {id: newId(), role: 'user', content: trimmed}
      const assistantId = newId()

      setError(null)
      setChat((c) => ({
        state: 'streaming',
        messages: [...c.messages, userMessage, {id: assistantId, role: 'assistant', content: ''}],
      }))
      setStatus((s) => ({...s, state: 'streaming'}))
      const started = performance.now()
      const priorHistory = chat.messages

      streamAssistant(
        {
          mode: 'chat',
          locale,
          question: trimmed,
          history: priorHistory,
          advert: matching.advert || undefined,
        },
        {
          signal: controller.signal,
          onDelta: (full) => {
            setChat((c) => ({
              ...c,
              messages: c.messages.map((m) => (m.id === assistantId ? {...m, content: full} : m)),
            }))
          },
        }
      )
        .then(({model}) => {
          setChat((c) => ({...c, state: 'done'}))
          setStatus({state: 'done', model, latencyMs: Math.round(performance.now() - started)})
        })
        .catch((err) => {
          if (controller.signal.aborted) return
          setChat((c) => ({
            state: 'error',
            // Drop the empty assistant placeholder on failure.
            messages: c.messages.filter((m) => m.id !== assistantId),
          }))
          setStatus((s) => ({...s, state: 'idle'}))
          setError(toError(err))
        })
    },
    [chat.messages, locale, matching.advert, toError]
  )

  const clearChat = useCallback(() => {
    chatAbort.current?.abort()
    setChat({state: 'idle', messages: []})
  }, [])

  const runSummary = useCallback(() => {
    const ids = readMarkedIds()
    if (ids.length === 0) return

    summaryAbort.current?.abort()
    const controller = new AbortController()
    summaryAbort.current = controller

    setError(null)
    setSummary({state: 'streaming', text: '', open: true, ids})
    setStatus((s) => ({...s, state: 'streaming'}))
    const started = performance.now()

    streamAssistant(
      {mode: 'summary', locale, markedIds: ids},
      {
        signal: controller.signal,
        onDelta: (full) => setSummary((s) => ({...s, text: full})),
      }
    )
      .then(({model}) => {
        setSummary((s) => ({...s, state: 'done'}))
        setStatus({state: 'done', model, latencyMs: Math.round(performance.now() - started)})
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setSummary((s) => ({...s, state: 'error'}))
        setStatus((s) => ({...s, state: 'idle'}))
        setError(toError(err))
      })
  }, [locale, toError])

  const closeSummary = useCallback(() => {
    summaryAbort.current?.abort()
    setSummary((s) => ({...s, open: false}))
  }, [])

  const dismissError = useCallback(() => setError(null), [])

  const value = useMemo<AppStateValue>(
    () => ({
      setHover,
      clearHover,
      focusEntry,
      matching,
      runMatching,
      resetMatching,
      chat,
      runChat,
      clearChat,
      summary,
      runSummary,
      closeSummary,
      status,
      error,
      dismissError,
    }),
    [
      setHover,
      clearHover,
      focusEntry,
      matching,
      runMatching,
      resetMatching,
      chat,
      runChat,
      clearChat,
      summary,
      runSummary,
      closeSummary,
      status,
      error,
      dismissError,
    ]
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
