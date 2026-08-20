import React from 'react'
import {Page, StyleSheet, Text, View} from '@react-pdf/renderer'
import {MONO, SANS} from './fonts'
import {GUTTER, color, foot, leading, page, size, space, tracking} from './theme'

/**
 * The furniture both documents share: the page itself, its running foot, the
 * mono section headers and the id gutter. Kept in one module so the CV and the
 * notes summary cannot drift into two different typographic systems.
 */

const s = StyleSheet.create({
  page: {
    paddingTop: page.top,
    paddingBottom: page.bottom,
    paddingLeft: page.left,
    paddingRight: page.right,
    backgroundColor: color.paper,
    color: color.ink,
    fontFamily: SANS,
    fontSize: size.body,
    lineHeight: leading.body,
  },

  // The running foot: a hairline, the document's name, the page count. Every
  // sheet says what it is and where it sits, which is all a CV needs — no
  // running head repeating the same thing at the top.
  // See theme.foot for why these are anchored from the top of the sheet.
  footRule: {
    position: 'absolute',
    top: foot.rule,
    left: page.left,
    right: page.right,
    borderTopWidth: 0.5,
    borderTopColor: color.rule,
  },
  footText: {
    position: 'absolute',
    top: foot.text,
    left: page.left,
    right: page.right,
    fontFamily: MONO,
    fontSize: size.mono,
    letterSpacing: tracking.mono,
    color: color.muted,
  },
  // Same box, right-aligned. Spelled out rather than composed from footText:
  // one style object per element keeps the dynamic node's box predictable.
  footPage: {
    position: 'absolute',
    top: foot.text,
    left: page.left,
    right: page.right,
    fontFamily: MONO,
    fontSize: size.mono,
    letterSpacing: tracking.mono,
    textAlign: 'right',
    color: color.muted,
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: space.sm,
    paddingBottom: space.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: color.ruleStrong,
  },
  sectionIndex: {
    width: GUTTER,
    fontFamily: MONO,
    fontSize: size.mono,
    color: color.muted,
  },
  sectionTitle: {
    fontFamily: MONO,
    fontSize: size.mono,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: color.ink,
  },

  // Every entry keeps the same breathing room; only the hairline is optional,
  // so a section's first entry sits on the same rhythm as the rest.
  row: {flexDirection: 'row', paddingTop: space.md, paddingBottom: space.md},
  // A list of digests rather than full entries (the notes summary) sits tighter
  // — the rhythm follows how much each row actually carries.
  rowCompact: {flexDirection: 'row', paddingTop: space.sm, paddingBottom: space.sm},
  rowDivided: {borderTopWidth: 0.5, borderTopColor: color.rule},
  // The id alone in the margin. On screen a hairline tick points at it, but at
  // this size it reads as a dash in front of the id rather than as a trace of
  // the grid — and on paper the section rules and entry hairlines show the grid
  // well enough.
  gutter: {
    width: GUTTER,
    paddingRight: space.md,
    // Hugs the top of the entry (a stretched column would centre the id
    // against the whole entry), and pads down onto the first line's cap height.
    alignSelf: 'flex-start',
    paddingTop: 2,
  },
  gutterId: {
    fontFamily: MONO,
    fontSize: size.mono,
    lineHeight: leading.mono,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: color.muted,
  },
  body: {flex: 1},
})

type FramedPageProps = {
  /** Left half of the running foot — "Name · document kind". */
  slug: string
  /** Formats "page 2 of 3" in the reader's language. */
  pageLabel: (current: number, total: number) => string
  children: React.ReactNode
}

/** An A4 page: content between the margins, one running foot on every sheet. */
export function FramedPage({slug, pageLabel, children}: FramedPageProps) {
  return (
    <Page size="A4" style={s.page} wrap>
      {/* The foot is declared before the content on purpose: a `fixed` node
          placed after it is not painted at all. */}
      <View style={s.footRule} fixed />
      <Text style={s.footText} fixed>
        {slug}
      </Text>
      <Text
        style={s.footPage}
        fixed
        render={({pageNumber, totalPages}) => pageLabel(pageNumber, totalPages)}
      />

      {children}
    </Page>
  )
}

/** A section header: running number in the gutter, label in mono, then a rule. */
export function SectionHead({index, title}: {index: number; title: string}) {
  return (
    <View style={s.sectionHead} wrap={false}>
      <Text style={s.sectionIndex}>{String(index).padStart(2, '0')}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  )
}

type GutterRowProps = {
  /** The entry's stable id — printed verbatim, because this is what the
      matching, the chat and the notes cite when they point into the CV. */
  id: string
  /** Keeps an entry whole on one page, the paper equivalent of
      `break-inside: avoid`. Long entries may opt out. */
  keepTogether?: boolean
  /** A hairline above the entry, as on screen — entries are separated by a
      line, never by a card. The first entry of a section leaves it out: the
      section's own rule already sits there, and two rules a few points apart
      read as a mistake. */
  divider?: boolean
  /** Tighter padding, for a row that carries a digest rather than an entry. */
  compact?: boolean
  children: React.ReactNode
}

/** One addressable entry: identifier in the margin, substance beside it. */
export function GutterRow({
  id,
  keepTogether = true,
  divider = true,
  compact = false,
  children,
}: GutterRowProps) {
  const row = compact ? s.rowCompact : s.row

  return (
    <View style={divider ? [row, s.rowDivided] : row} wrap={!keepTogether}>
      <View style={s.gutter}>
        <Text style={s.gutterId}>{id}</Text>
      </View>
      <View style={s.body}>{children}</View>
    </View>
  )
}
