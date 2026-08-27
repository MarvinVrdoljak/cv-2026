import React from 'react'
import {Document, Image, Link, Path, StyleSheet, Svg, Text, View} from '@react-pdf/renderer'
import type {Locale} from '@/i18n/routing'
import {cv} from '@/data/cv'
import {sectionNumber} from '@/lib/sections'
import {durationInMonths, formatFullDate, formatMonth, splitDuration} from '@/lib/format'
import {printPortrait} from './assets'
import {MONO} from './fonts'
import {FramedPage, GutterRow, SectionHead} from './frame'
import type {QrPdfLabels} from './labels'
import {encodeQr} from './qr'
import {color, leading, size, space, tracking} from './theme'

/**
 * The one-page card: enough to decide whether to read on, and a way in.
 *
 * This is the sheet that gets handed over or attached — a first impression,
 * not the CV. So it carries the parts a reader forms an opinion from: who, the
 * profile, and whatever the data marks `card` — the stations that still
 * describe the work, the degree, the terms that are daily practice. It leaves
 * out what only matters once the reader is interested: per-station highlights,
 * languages, the short certificates, the long tail of every term that is true.
 * Those live in the full document and, above all, in the interactive CV the
 * code points at — the point of this page is to stop being paper.
 *
 * Which entries those are is a decision about paper and belongs to the data
 * (`card` on the entry), not here. This file only prints them — and stays one
 * sheet: flag another entry and check the page count.
 *
 * Same source and same typographic system as the other two documents. The
 * stations and groups keep their ids, so a reader who scans the code finds the
 * very entries they just read about, under the same names.
 *
 * Achromatic on purpose: the accent is for active states on screen, and on a
 * sheet with one call to action a red line reads as a warning.
 */

/** Printed edge length of the code. ~30mm — comfortable for a phone camera. */
const QR_SIZE = 82

const s = StyleSheet.create({
  // ---- identity -------------------------------------------------------
  // Restated rather than shared with CvPdf: the card runs tighter than the
  // full document, and the two are allowed to size their head differently.
  identity: {marginBottom: space.md},
  identityHead: {flexDirection: 'row', alignItems: 'center', gap: space.lg},
  portrait: {
    width: 56,
    height: 56,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: color.ruleStrong,
  },
  identityText: {flex: 1},
  name: {
    fontSize: size.name,
    fontWeight: 600,
    letterSpacing: tracking.display,
    lineHeight: leading.heading,
  },
  role: {
    marginTop: space.xs,
    fontFamily: MONO,
    fontSize: size.small,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: color.ink,
    lineHeight: leading.mono,
  },
  meta: {
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
  metaSep: {color: color.ruleStrong},
  metaLink: {color: color.muted, textDecoration: 'none'},

  // ---- sections -------------------------------------------------------
  section: {marginTop: space.md},
  paragraph: {marginBottom: space.sm, fontSize: size.body, lineHeight: leading.body},

  // The card's own entry shape: three columns of decreasing interface-ness —
  // the id, the period, then the substance. One voice per line, never two: a
  // tracked-out mono period, a bold role and a muted employer crowded onto the
  // same line read as three competing signals, which is exactly what made the
  // first version restless. So the period keeps its column and the role and
  // the employer take a line each, same reading order as the full document.
  line: {flexDirection: 'row', gap: space.md},
  // Mixed case with `tracking.mono`, like the CV's date lines — the ids in the
  // margin are the upper-case ones, and that is what tells the two columns
  // apart.
  lineKey: {
    width: 84,
    flexShrink: 0,
    paddingTop: 1.5,
    fontFamily: MONO,
    fontSize: size.mono,
    lineHeight: leading.mono,
    letterSpacing: tracking.mono,
    color: color.muted,
  },
  lineBody: {flex: 1},
  lineTitle: {fontSize: size.body, fontWeight: 600, lineHeight: leading.heading},
  lineDetail: {
    marginTop: 2,
    fontSize: size.small,
    lineHeight: leading.heading,
    color: color.muted,
  },
  // Prose, so it takes the reading leading and the full ink — the muted line
  // above it is meta about the station, this is the station.
  lineSummary: {
    marginTop: space.xs,
    fontSize: size.small,
    lineHeight: leading.body,
    color: color.ink,
  },

  // ---- skills ---------------------------------------------------------
  // Flush to the left margin and across the full measure: no gutter, because
  // there is no single id to put in it. The padding is the one `GutterRow`
  // would have contributed, so the block keeps the page's rhythm.
  skills: {
    paddingTop: space.sm,
    paddingBottom: space.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  // The same box as in the CV and the notes summary — see the note in CvPdf on
  // the height, the line height and the optical correction at the bottom. A
  // long line of terms separated by middots is a wall; the boxes give each
  // term its own edge, which is what makes twenty of them readable at a glance.
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

  // ---- the way in -----------------------------------------------------
  // A band, not a card: one hairline above it, like every other division on
  // the page. It comes last because it is the exit, and it sits at the foot of
  // the sheet rather than trailing the content — see `spacer`.
  scan: {
    paddingTop: space.md,
    marginBottom: space.sm,
    borderTopWidth: 0.5,
    borderTopColor: color.ruleStrong,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.lg,
  },
  // Eats the leftover height, so the band is pinned to the bottom margin
  // instead of floating wherever the content happens to end. The minimum
  // keeps it off the last line when the page is nearly full; if even that no
  // longer fits, the band moves to a second sheet rather than colliding.
  spacer: {flexGrow: 1, minHeight: space.lg},
  scanText: {flex: 1},
  // Muted, not the accent: the code and the heading below carry this band on
  // their own, and one red line on an otherwise achromatic sheet reads as a
  // warning rather than as an invitation.
  scanLabel: {
    fontFamily: MONO,
    fontSize: size.mono,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: color.muted,
  },
  scanTitle: {
    marginTop: space.xs,
    fontSize: size.docTitle,
    fontWeight: 600,
    letterSpacing: tracking.display,
    lineHeight: leading.heading,
  },
  scanHint: {marginTop: space.sm, fontSize: size.body, lineHeight: leading.body},
  // The one piece of mono on either medium that is not upper case: this is an
  // address meant to be typed, and a path is case-sensitive. Underlined
  // instead, because here the link is the instruction.
  scanUrl: {
    marginTop: space.sm,
    fontFamily: MONO,
    fontSize: size.small,
    letterSpacing: tracking.mono,
    color: color.ink,
    textDecoration: 'underline',
  },
  code: {width: QR_SIZE, height: QR_SIZE},
})

/** The flagged stations, in CV order. */
const cardExperience = cv.experience.filter((entry) => entry.card)

/** The flagged qualifications — the degree, not the afternoon certificates. */
const cardEducation = cv.education.filter((entry) => entry.card)

/** The flagged terms, in CV order. */
const cardItems = cv.skills.flatMap((group) =>
  group.items.filter((item) => item.card).map((item) => item.name)
)

type QrPdfProps = {
  locale: Locale
  labels: QrPdfLabels
  /** The address the code encodes — resolved from the request, never guessed. */
  url: string
}

export function QrPdf({locale, labels, url}: QrPdfProps) {
  const slug = `${cv.person.name} · ${labels.docTitle}`
  const portrait = printPortrait()
  const qr = encodeQr(url)

  return (
    <Document
      title={`${cv.person.name} — ${labels.docTitle}`}
      author={cv.person.name}
      subject={cv.person.role[locale]}
      creator={cv.person.name}
      producer={cv.person.name}
      language={locale}
    >
      <FramedPage slug={slug} pageLabel={labels.pageLabel}>
        <View style={s.identity} wrap={false}>
          <View style={s.identityHead}>
            {portrait ? <Image src={portrait} style={s.portrait} /> : null}
            <View style={s.identityText}>
              <Text style={s.name}>{cv.person.name}</Text>
              <Text style={s.role}>{cv.person.role[locale]}</Text>
            </View>
          </View>

          <View style={s.meta}>
            <Text>
              {labels.born} {formatFullDate(cv.person.birthDate, locale)}
            </Text>
            <Text style={s.metaSep}>·</Text>
            <Text>{cv.person.location}</Text>
            <Text style={s.metaSep}>·</Text>
            <Link src={`mailto:${cv.person.email}`} style={s.metaLink}>
              {cv.person.email}
            </Link>
            {cv.person.links.map((link) => (
              <React.Fragment key={link.id}>
                <Text style={s.metaSep}>·</Text>
                <Link src={link.href} style={s.metaLink}>
                  {link.label}
                </Link>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ---- 01 profile ---- */}
        <View style={s.section}>
          <SectionHead index={sectionNumber('profile')} title={labels.sections.profile} />
          <GutterRow id={cv.profile.id} keepTogether={false} divider={false} compact>
            {(cv.profile.text[locale] ?? cv.profile.text.de)
              .split('\n')
              .filter((line) => line.trim() !== '')
              .map((paragraph, index, all) => (
                <Text
                  key={index}
                  style={index === all.length - 1 ? [s.paragraph, {marginBottom: 0}] : s.paragraph}
                >
                  {paragraph}
                </Text>
              ))}
          </GutterRow>
        </View>

        {/* ---- 02 experience, one station per row ---- */}
        <View style={s.section}>
          <SectionHead index={sectionNumber('experience')} title={labels.sections.experience} />
          {cardExperience.map((entry, index) => {
            const {years, months} = splitDuration(durationInMonths(entry.from, entry.to))
            const [company, ...rest] = entry.organisation.split(' · ')

            return (
              <GutterRow id={entry.id} key={entry.id} divider={index > 0} compact>
                <View style={s.line}>
                  <Text style={s.lineKey}>
                    {formatMonth(entry.from, locale)} –{' '}
                    {entry.to ? formatMonth(entry.to, locale) : labels.present}
                  </Text>
                  <View style={s.lineBody}>
                    <Text style={s.lineTitle}>{entry.role[locale]}</Text>
                    <Text style={s.lineDetail}>
                      {[company, ...rest, entry.location, labels.duration(years, months)].join(
                        ' · '
                      )}
                    </Text>
                    {/* Only where the data asked for it — see `card` in cv.ts.
                        Four sentences would be a second page. */}
                    {entry.card === 'summary' ? (
                      <Text style={s.lineSummary}>{entry.summary[locale]}</Text>
                    ) : null}
                  </View>
                </View>
              </GutterRow>
            )
          })}
        </View>

        {/* ---- 03 education, the degree only ---- */}
        {cardEducation.length > 0 ? (
          <View style={s.section}>
            <SectionHead index={sectionNumber('education')} title={labels.sections.education} />
            {cardEducation.map((entry, index) => (
              <GutterRow id={entry.id} key={entry.id} divider={index > 0} compact>
                <View style={s.line}>
                  <Text style={s.lineKey}>
                    {formatMonth(entry.from, locale)} –{' '}
                    {entry.to ? formatMonth(entry.to, locale) : labels.present}
                  </Text>
                  <View style={s.lineBody}>
                    <Text style={s.lineTitle}>{entry.qualification[locale]}</Text>
                    {/* No note and no credential line: the card carries the
                        degree, and everything that qualifies it is a click or
                        a page away. */}
                    <Text style={s.lineDetail}>{entry.institution}</Text>
                  </View>
                </View>
              </GutterRow>
            ))}
          </View>
        ) : null}

        {/* ---- 04 skills, the flagged terms as one set of chips ---- */}
        <View style={s.section}>
          <SectionHead index={sectionNumber('skills')} title={labels.sections.skills} />
          {/* The terms flagged `card` in the data, in CV order, out of their
              groups: seven labelled rows are half this page, and a card is
              read in one pass. The selection lives with the data (see the note
              on `CvSkillItem`), not here — this only prints it.

              The one block on the card without the id gutter, and so the one
              that runs the full measure. Half a dozen group ids stacked beside
              a set of chips point at nothing in particular — the chips are not
              one entry each — and the section on screen is where the labels,
              the full lists and the honest notes are anyway. */}
          <View style={s.skills}>
            {cardItems.map((item) => (
              <View style={s.chip} key={item}>
                <Text style={s.chipLabel}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.spacer} />

        {/* ---- the way in ---- */}
        <View style={s.scan} wrap={false}>
          <View style={s.scanText}>
            <Text style={s.scanLabel}>{labels.scanLabel}</Text>
            <Text style={s.scanTitle}>{labels.scanTitle}</Text>
            <Text style={s.scanHint}>{labels.scanHint}</Text>
            <Link src={url} style={s.scanUrl}>
              {url.replace(/^https?:\/\//, '')}
            </Link>
          </View>

          {/* The code is a link too, so the same square works on a screen. */}
          <Link src={url}>
            <Svg style={s.code} viewBox={`0 0 ${qr.size} ${qr.size}`}>
              <Path d={qr.path} fill={color.ink} />
            </Svg>
          </Link>
        </View>
      </FramedPage>
    </Document>
  )
}
