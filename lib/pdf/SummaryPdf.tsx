import React from 'react'
import {Document, StyleSheet, Text, View} from '@react-pdf/renderer'
import type {Locale} from '@/i18n/routing'
import {cv} from '@/data/cv'
import {parseAssistantText, type AssistantSegment} from '@/lib/citations'
import {MONO} from './fonts'
import {FramedPage, GutterRow, SectionHead} from './frame'
import type {SummaryPdfLabels} from './labels'
import type {MarkedItem} from './marked'
import {color, leading, size, space, tracking} from './theme'

/**
 * The notes summary on paper: what was marked, and the assessment of it — the
 * printable output the brief asks for, as a real document rather than a
 * flattened dialog.
 *
 * The marked entries are resolved from the CV data rather than printed as bare
 * ids, so the sheet stands on its own; the citations in the assessment keep the
 * ids, set exactly like the ones in the margin, so a reader can follow them
 * back into the CV.
 */

const s = StyleSheet.create({
  kicker: {
    fontFamily: MONO,
    fontSize: size.mono,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: color.muted,
  },
  title: {
    marginTop: space.xs,
    fontSize: size.docTitle,
    fontWeight: 600,
    letterSpacing: tracking.display,
    lineHeight: leading.heading,
  },
  // Same treatment as the CV's contact row: mono, tracked out, upper case.
  head: {
    marginTop: space.md,
    paddingTop: space.sm,
    borderTopWidth: 0.5,
    borderTopColor: color.rule,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.sm,
    fontFamily: MONO,
    fontSize: size.mono,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: color.muted,
  },
  headSep: {color: color.ruleStrong},

  section: {marginTop: space.section},

  itemMeta: {
    marginBottom: space.xs,
    fontFamily: MONO,
    fontSize: size.mono,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: color.muted,
  },
  itemTitle: {fontSize: size.title, fontWeight: 600, lineHeight: leading.heading},
  itemLead: {fontSize: size.body, lineHeight: leading.body},
  itemDetail: {marginTop: space.xs, fontSize: size.body, lineHeight: leading.body},
  chips: {marginTop: space.sm, flexDirection: 'row', flexWrap: 'wrap', gap: space.xs},
  // Same box as in the CV — see the note there on height, line height and the
  // optical correction at the bottom.
  chip: {
    height: 15,
    justifyContent: 'center',
    paddingBottom: 1.5,
    paddingHorizontal: 6,
    borderWidth: 0.5,
    borderColor: color.ruleStrong,
    borderRadius: 2,
  },
  chipLabel: {
    fontFamily: MONO,
    fontSize: size.mono,
    lineHeight: leading.mono,
    color: color.ink,
  },

  paragraph: {marginBottom: space.sm, fontSize: size.body, lineHeight: leading.body},
  /** A citation, set as what it is: an address into the document — and set the
      same way as the ids in the margin, so the two read as one system. */
  ref: {
    fontFamily: MONO,
    fontSize: size.mono,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: color.accent,
  },
  link: {color: color.ink},
  missing: {fontSize: size.small, fontStyle: 'italic', color: color.muted},
})

/** Splits the segment stream into paragraphs, so blank lines survive print. */
function toParagraphs(segments: AssistantSegment[]): AssistantSegment[][] {
  const paragraphs: AssistantSegment[][] = [[]]
  const current = () => paragraphs[paragraphs.length - 1]

  for (const segment of segments) {
    if (segment.kind !== 'text') {
      current().push(segment)
      continue
    }
    const parts = segment.text.split(/\n{1,}/)
    parts.forEach((part, index) => {
      if (index > 0) paragraphs.push([])
      if (part !== '') current().push({kind: 'text', text: part})
    })
  }

  return paragraphs.filter((paragraph) => paragraph.length > 0)
}

type SummaryPdfProps = {
  locale: Locale
  labels: SummaryPdfLabels
  /** The marked entries, already resolved and in document order. */
  marked: MarkedItem[]
  /** The streamed assessment, verbatim — parsed here, never rewritten. */
  assessment: string
  /** Render date, formatted by the caller in the reader's locale. */
  date: string
}

export function SummaryPdf({locale, labels, marked, assessment, date}: SummaryPdfProps) {
  const slug = `${cv.person.name} · ${labels.docTitle}`
  const paragraphs = toParagraphs(parseAssistantText(assessment))

  return (
    <Document
      title={`${cv.person.name} — ${labels.docTitle}`}
      author={cv.person.name}
      subject={labels.docTitle}
      creator={cv.person.name}
      producer={cv.person.name}
      language={locale}
    >
      <FramedPage slug={slug} pageLabel={labels.pageLabel}>
        <View wrap={false}>
          <Text style={s.kicker}>{labels.sourceTitle}</Text>
          <Text style={s.title}>{labels.docTitle}</Text>
          <View style={s.head}>
            <Text>{cv.person.name}</Text>
            <Text style={s.headSep}>·</Text>
            <Text>{labels.generated(date)}</Text>
            <Text style={s.headSep}>·</Text>
            <Text>{labels.countLabel(marked.length)}</Text>
          </View>
        </View>

        {/* ---- 01 what was marked ---- */}
        <View style={s.section}>
          <SectionHead index={1} title={labels.markedLabel} />
          {marked.map((item, index) => (
            <GutterRow id={item.id} key={item.id} divider={index > 0} compact>
              {/* Where it came from and when, on one mono line — the same
                  reading order the CV itself uses. */}
              <Text style={s.itemMeta}>
                {[labels.sections[item.section], item.meta].filter(Boolean).join(' · ')}
              </Text>
              {/* Untitled entries (the profile) put their prose where the
                  title would be — the mono line above already says which
                  entry this is. */}
              <Text style={item.title ? s.itemTitle : s.itemLead}>{item.title ?? item.detail}</Text>
              {item.title && item.detail ? <Text style={s.itemDetail}>{item.detail}</Text> : null}
              {item.items.length > 0 ? (
                <View style={s.chips}>
                  {item.items.map((value) => (
                    <View style={s.chip} key={value}>
                      <Text style={s.chipLabel}>{value}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </GutterRow>
          ))}
        </View>

        {/* ---- 02 the assessment ---- */}
        <View style={s.section}>
          <SectionHead index={2} title={labels.assessmentLabel} />

          {paragraphs.length === 0 ? (
            <Text style={s.missing}>{labels.assessmentMissing}</Text>
          ) : (
            paragraphs.map((paragraph, index) => (
              <Text style={s.paragraph} key={index}>
                {paragraph.map((segment, segmentIndex) => {
                  if (segment.kind === 'ref') {
                    return (
                      <Text style={s.ref} key={segmentIndex}>
                        {segment.id}
                      </Text>
                    )
                  }
                  if (segment.kind === 'link') {
                    return (
                      <Text style={s.link} key={segmentIndex}>
                        {segment.label}
                      </Text>
                    )
                  }
                  return <Text key={segmentIndex}>{segment.text}</Text>
                })}
              </Text>
            ))
          )}
        </View>
      </FramedPage>
    </Document>
  )
}
