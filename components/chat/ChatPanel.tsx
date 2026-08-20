'use client'

import {useEffect, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'
import {FOCUS_TARGET} from '@/lib/ids'
import {MAX_LENGTH} from '@/lib/rateLimit'
import {useAppState} from '@/components/app/AppState'
import {RefText} from '@/components/app/RefText'
import {KeyHint} from '@/components/shell/KeyHint'
import styles from './ChatPanel.module.css'

/**
 * Permanently present, never a widget to open: its own column on desktop, a
 * bar at the bottom edge on mobile that unfolds on focus. Answers stream token
 * by token and cite CV entries the reader can jump to.
 */
export function ChatPanel() {
  const t = useTranslations('chat')
  const {chat, runChat, clearChat} = useAppState()
  const [text, setText] = useState('')
  const transcriptRef = useRef<HTMLDivElement>(null)

  const streaming = chat.state === 'streaming'

  // Four suggestions, fixed for the session: seeded deterministically for SSR,
  // then shuffled once on mount (client-only, so no hydration mismatch). They
  // do not change on scroll.
  const pool = t.raw('suggestions') as string[]
  const [suggestions, setSuggestions] = useState<string[]>(() => pool.slice(0, 4))
  useEffect(() => {
    const p = t.raw('suggestions') as string[]
    setSuggestions([...p].sort(() => Math.random() - 0.5).slice(0, 4))
    // Run once on mount — a fresh random set per visit, stable thereafter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the newest turn in view as it streams.
  useEffect(() => {
    const el = transcriptRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat.messages])

  function send(value: string) {
    if (!value.trim() || streaming) return
    runChat(value)
    setText('')
  }

  return (
    <div className={styles.root}>
      <div className={styles.collapsible}>
        <div className={styles.inner}>
          <div className={styles.head}>
            <h2 className={styles.title}>{t('title')}</h2>
            <KeyHint combo="slash" />
            {chat.messages.length > 0 ? (
              <button className={styles.clear} type="button" onClick={clearChat}>
                {t('clear')}
              </button>
            ) : null}
          </div>

          <p className={styles.hint}>{t('hint')}</p>

          <div
            className={styles.transcript}
            ref={transcriptRef}
            aria-live="polite"
            aria-label={t('streamLabel')}
          >
            {chat.messages.length === 0 ? (
              <p className={styles.empty}>{t('empty')}</p>
            ) : (
              <ul className={styles.messages}>
                {chat.messages.map((message) => (
                  <li className={styles.message} key={message.id} data-role={message.role}>
                    <span className={styles.role}>
                      {message.role === 'user' ? t('you') : t('answerLabel')}
                    </span>
                    <div className={styles.body}>
                      {message.role === 'assistant' ? (
                        <>
                          <RefText content={message.content} />
                          {streaming && message.content === '' ? (
                            <span className={styles.caret} aria-hidden="true" />
                          ) : null}
                        </>
                      ) : (
                        message.content
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {chat.messages.length === 0 && suggestions.length > 0 ? (
            <div className={styles.suggestions}>
              <p className={styles.suggestionsLabel}>{t('suggestionsLabel')}</p>
              <ul className={styles.chips}>
                {suggestions.map((question) => (
                  <li className={styles.chipItem} key={question}>
                    <button
                      className={styles.chip}
                      type="button"
                      onClick={() => send(question)}
                      disabled={streaming}
                    >
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault()
          send(text)
        }}
      >
        <label className="visually-hidden" htmlFor="chat-input">
          {t('inputLabel')}
        </label>
        <input
          className={styles.input}
          id="chat-input"
          name="question"
          type="text"
          autoComplete="off"
          maxLength={MAX_LENGTH.question}
          placeholder={t('placeholder')}
          data-focus={FOCUS_TARGET.chat}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button className={styles.send} type="submit" disabled={!text.trim() || streaming}>
          {t('send')}
        </button>
      </form>
    </div>
  )
}
