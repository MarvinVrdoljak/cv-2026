import React from 'react'
import {Document, Image, Link, StyleSheet, Text, View} from '@react-pdf/renderer'
import type {Locale} from '@/i18n/routing'
import {cv} from '@/data/cv'
import {sectionNumber} from '@/lib/sections'
import {
  durationInMonths,
  formatFullDate,
  formatMonth,
  formatYearRange,
  splitDuration,
} from '@/lib/format'
import {printPortrait} from './assets'
import {MONO} from './fonts'
import {FramedPage, GutterRow, SectionHead} from './frame'
import type {CvPdfLabels} from './labels'
import {color, leading, size, space, tracking} from './theme'

/**
 * The CV as a document again — not a screenshot of the interface.
 *
 * It is the same content, in the same order, from the same single source as
 * the page: identity, profile, experience, skills, education, languages. What
 * changes is the medium: the interface (matching, chat, marking) has no
 * business on paper, while the things a screen fakes — a real page, a running
 * foot, entries that do not break across sheets — become available.
 */

const s = StyleSheet.create({
  // ---- identity -------------------------------------------------------
  identity: {marginBottom: space.md},
  // Centred against the portrait, as on screen — not sitting on its baseline.
  identityHead: {flexDirection: 'row', alignItems: 'center', gap: space.lg},
  portrait: {
    width: 68,
    height: 68,
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
  // Mono, tracked out, upper case — the same switch the screen makes: the name
  // carries the display voice, the role the interface one, and the contact row
  // below recedes into muted. Three bands, three degrees of loudness.
  role: {
    marginTop: space.sm,
    fontFamily: MONO,
    fontSize: size.small,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: color.ink,
    lineHeight: leading.mono,
  },
  // The contact row is interface, not prose: mono, tracked out and upper case,
  // exactly like the screen's identity meta and like every other label here.
  meta: {
    marginTop: space.lg,
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
  section: {marginTop: space.section},

  // ---- entries --------------------------------------------------------
  paragraph: {marginBottom: space.sm, fontSize: size.body, lineHeight: leading.body},
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.xs,
    fontFamily: MONO,
    fontSize: size.mono,
    letterSpacing: tracking.mono,
  },
  period: {color: color.ink},
  duration: {color: color.muted},
  entryTitle: {fontSize: size.title, fontWeight: 600, lineHeight: leading.heading},
  organisation: {
    marginTop: space.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Tight, because each segment already carries its own middot.
    gap: 3,
    fontSize: size.small,
    color: color.muted,
  },
  organisationName: {color: color.ink},
  summary: {marginTop: space.sm, fontSize: size.body, lineHeight: leading.body},
  highlights: {marginTop: space.sm, gap: space.xs},
  highlight: {flexDirection: 'row', gap: space.sm},
  highlightRule: {
    width: 10,
    // Onto the first line's middle, so the hairline reads as a marker.
    marginTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: color.ruleStrong,
  },
  highlightText: {flex: 1, fontSize: size.body, lineHeight: leading.body},

  // ---- skills ---------------------------------------------------------
  groupLabel: {fontSize: size.title, fontWeight: 600, lineHeight: leading.heading},
  chips: {marginTop: space.sm, flexDirection: 'row', flexWrap: 'wrap', gap: space.xs},
  // A fixed height with centred content, because padding around a text box
  // that carries the page's line height puts the type off centre in the frame.
  // The label keeps the font's own line height: squeeze it below that and the
  // baseline drops out of the middle, because IBM Plex asks for ~1.3em.
  //
  // `paddingBottom` is the optical correction on top of that: a centred line
  // box reserves room for descenders at the bottom, so the letters themselves
  // sit low in the frame. Measured on the rendered page, not guessed.
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
  note: {marginTop: space.sm, fontSize: size.small, lineHeight: leading.body, color: color.muted},

  // ---- education / languages -----------------------------------------
  institution: {marginTop: 2, fontSize: size.small, color: color.muted},
  // Like the contact row: mono, tracked out, upper case, quiet.
  credential: {
    marginTop: space.sm,
    fontFamily: MONO,
    fontSize: size.mono,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: color.muted,
    textDecoration: 'none',
  },
})

type CvPdfProps = {
  locale: Locale
  labels: CvPdfLabels
}

export function CvPdf({locale, labels}: CvPdfProps) {
  const slug = `${cv.person.name} · ${labels.docTitle}`
  const portrait = printPortrait()

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
        {/* ---- head of the document, not a hero ---- */}
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
          <GutterRow id={cv.profile.id} keepTogether={false} divider={false}>
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

        {/* ---- 02 experience ---- */}
        <View style={s.section}>
          <SectionHead index={sectionNumber('experience')} title={labels.sections.experience} />
          {cv.experience.map((entry, index) => {
            const {years, months} = splitDuration(durationInMonths(entry.from, entry.to))
            // Split "Company · Vollzeit" so only the company name links.
            const [company, ...rest] = entry.organisation.split(' · ')

            return (
              <GutterRow id={entry.id} key={entry.id} keepTogether={false} divider={index > 0}>
                {/* Dates, role and employer are one unit: a station may run on
                    to the next sheet, but never lose its own heading. */}
                <View wrap={false}>
                  <View style={s.entryMeta}>
                    <Text style={s.period}>
                      {formatMonth(entry.from, locale)} –{' '}
                      {entry.to ? formatMonth(entry.to, locale) : labels.present}
                    </Text>
                    <Text style={s.duration}>{labels.duration(years, months)}</Text>
                  </View>

                  <Text style={s.entryTitle}>{entry.role[locale]}</Text>

                  <View style={s.organisation}>
                    {entry.organisationHref ? (
                      <Link src={entry.organisationHref} style={[s.organisationName, s.metaLink]}>
                        {company}
                      </Link>
                    ) : (
                      <Text style={s.organisationName}>{company}</Text>
                    )}
                    {[...rest, entry.location].map((segment) => (
                      <Text key={segment}>· {segment}</Text>
                    ))}
                  </View>

                  <Text style={s.summary}>{entry.summary[locale]}</Text>
                </View>

                <View style={s.highlights}>
                  {entry.highlights.map((highlight, index) => (
                    <View style={s.highlight} key={`${entry.id}-h${index}`}>
                      <View style={s.highlightRule} />
                      <Text style={s.highlightText}>{highlight[locale]}</Text>
                    </View>
                  ))}
                </View>
              </GutterRow>
            )
          })}
        </View>

        {/* ---- 03 education ---- */}
        <View style={s.section}>
          <SectionHead index={sectionNumber('education')} title={labels.sections.education} />
          {cv.education.map((entry, index) => (
            <GutterRow id={entry.id} key={entry.id} divider={index > 0}>
              <View style={s.entryMeta}>
                <Text style={s.period}>
                  {formatYearRange(entry.from, entry.to, labels.present)}
                </Text>
              </View>
              <Text style={s.entryTitle}>{entry.qualification[locale]}</Text>
              <Text style={s.institution}>{entry.institution}</Text>
              {entry.note ? <Text style={s.note}>{entry.note[locale]}</Text> : null}
              {entry.href ? (
                <Link src={entry.href} style={s.credential}>
                  {labels.verify}
                  {entry.credentialId ? ` · ${entry.credentialId}` : ''}
                </Link>
              ) : null}
            </GutterRow>
          ))}
        </View>

        {/* ---- 04 skills ---- */}
        <View style={s.section}>
          <SectionHead index={sectionNumber('skills')} title={labels.sections.skills} />
          {cv.skills.map((group, index) => (
            <GutterRow id={group.id} key={group.id} divider={index > 0}>
              <Text style={s.groupLabel}>{group.label[locale]}</Text>
              <View style={s.chips}>
                {group.items.map((item) => (
                  <View style={s.chip} key={item.name}>
                    <Text style={s.chipLabel}>{item.name}</Text>
                  </View>
                ))}
              </View>
              {group.note ? <Text style={s.note}>{group.note[locale]}</Text> : null}
            </GutterRow>
          ))}
        </View>

        {/* ---- 05 languages ---- */}
        <View style={s.section}>
          <SectionHead index={sectionNumber('languages')} title={labels.sections.languages} />
          {cv.languages.map((entry, index) => (
            <GutterRow id={entry.id} key={entry.id} divider={index > 0}>
              {/* Same shape as every other entry — mono line above, title
                  below. On screen the two sit side by side; on paper that
                  pairs an 11pt sans with a 7.5pt mono on one line, and no
                  vertical alignment makes that look deliberate. */}
              <View style={s.entryMeta}>
                <Text style={s.period}>{entry.level[locale]}</Text>
              </View>
              <Text style={s.entryTitle}>{entry.language[locale]}</Text>
            </GutterRow>
          ))}
        </View>
      </FramedPage>
    </Document>
  )
}
