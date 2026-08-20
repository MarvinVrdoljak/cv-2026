import React from 'react'
import {EntryRef} from './EntryRef'

// Matches an inline citation like [exp-01] — three letters, dash, two digits.
const REF_PATTERN = /\[([a-z]{3}-\d{2})\]/g

/**
 * Renders assistant prose, turning inline [id] citations into interactive
 * EntryRef chips while leaving the surrounding text intact.
 */
export function RefText({content}: {content: string}) {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  REF_PATTERN.lastIndex = 0
  while ((match = REF_PATTERN.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index))
    }
    nodes.push(<EntryRef key={`ref-${key++}`} id={match[1]} />)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex))
  }

  return <>{nodes}</>
}
