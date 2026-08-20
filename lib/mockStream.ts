import type {AssistantMode} from '@/lib/types'
import {experienceIds} from '@/lib/cvContext'

/**
 * Scripted output for dev testing without an API key. Every payload is
 * visibly labelled as a placeholder so it cannot pass for a real assessment.
 * Used only when lib/openai.ts#mockEnabled() is true.
 */
export function mockScript(mode: AssistantMode): string[] {
  const tag = '[DEV-MOCK] '

  if (mode === 'matching') {
    const ids = experienceIds()
    return [
      JSON.stringify({type: 'order', ids}),
      JSON.stringify({
        type: 'finding',
        bucket: 'fit',
        text: tag + 'Platzhalter: React/Next.js/TypeScript decken die Kernanforderung ab.',
        refs: [ids[0]].filter(Boolean),
      }),
      JSON.stringify({
        type: 'finding',
        bucket: 'partial',
        text: tag + 'Platzhalter: Mobile-Erfahrung vorhanden, aber älter.',
        refs: [ids[1]].filter(Boolean),
      }),
      JSON.stringify({
        type: 'finding',
        bucket: 'gap',
        text: tag + 'Platzhalter: Backend-Tiefe wird im Lebenslauf nicht belegt.',
        refs: [],
      }),
    ]
  }

  if (mode === 'chat') {
    const ids = experienceIds()
    return [`${tag}Platzhalter-Antwort mit Referenz auf [${ids[0] ?? 'pro-01'}].`]
  }

  return [`${tag}Platzhalter-Einordnung der markierten Einträge.`]
}
