/* ============================================================
   The CV — one structured source. It feeds both the rendered
   document and (later) the model context. No duplicates anywhere.

   Every entry carries a stable `id`. Matching, chat and notes
   reference these ids to highlight, sort and collect entries,
   so ids must never be renumbered once published.

   Content: real data for Marvin Vrdoljak, from LinkedIn (roles,
   employers, dates and locations confirmed). Role summaries and
   highlights are written from the stated stack and context and
   contain no invented metrics.
   ============================================================ */

export type LocalizedText = {
  de: string
  en: string
}

/** `YYYY-MM`, or null for an ongoing engagement. */
export type YearMonth = `${number}-${string}`

export type CvLink = {
  id: string
  label: string
  href: string
}

export type CvExperience = {
  id: string
  from: YearMonth
  to: YearMonth | null
  role: LocalizedText
  organisation: string
  /** Employer website, if it should link. Only the company name links,
      not any " · type" suffix in `organisation`. */
  organisationHref?: string
  /** Where the work was done — city, country. */
  location: string
  /** One sentence. What the role was, not how great it went. */
  summary: LocalizedText
  highlights: LocalizedText[]
  stack: string[]
}

export type CvSkillItem = {
  /** The term itself, spelled the way it should be searched for. */
  name: string
  /**
   * Print this one on the one-page card (`/api/pdf?doc=qr`).
   *
   * The card has room for about twenty terms, so it carries the ones that are
   * daily work rather than everything that is true. Which ones is a judgement
   * about emphasis, not about the data — so it is a flag on the item and stays
   * next to it, instead of a second list somewhere that can drift.
   */
  card?: true
}

export type CvSkillGroup = {
  id: string
  label: LocalizedText
  items: CvSkillItem[]
  /** Optional one-line qualification of depth, in prose, never a bar. */
  note: LocalizedText | null
}

export type CvEducation = {
  id: string
  from: YearMonth
  to: YearMonth | null
  qualification: LocalizedText
  institution: string
  note: LocalizedText | null
  /** Verification URL (e.g. a Coursera credential), if the entry has one. */
  href?: string
  /** Credential / verification id, shown in mono next to the link. */
  credentialId?: string
}

export type CvLanguage = {
  id: string
  language: LocalizedText
  /** CEFR level or a plain word — no bars, no percentages. */
  level: LocalizedText
}

export type CvProject = {
  id: string
  name: string
  description: LocalizedText
  /** Public link (store page, site), if there is one. */
  href?: string
  stack: string[]
}

/**
 * Extra context the assistant may draw on but that the CV does not print. It
 * still lives in this one source (no duplicate store); it simply feeds the
 * model rather than the document. Leave a list empty and the assistant will
 * honestly say that information is not provided.
 */
export type CvAbout = {
  projects: CvProject[]
  /** Hobbies / interests, short phrases. */
  interests: LocalizedText[]
  strengths: LocalizedText[]
  weaknesses: LocalizedText[]
  /** Anything else worth knowing — one fact per line. */
  extra: LocalizedText[]
}

export type Cv = {
  person: {
    name: string
    role: LocalizedText
    location: string
    /** ISO `YYYY-MM-DD`. */
    birthDate: string
    email: string
    /** Public path to a portrait (in /public). Omit to render no photo. */
    photo?: string
    links: CvLink[]
  }
  profile: {
    id: string
    text: LocalizedText
  }
  experience: CvExperience[]
  skills: CvSkillGroup[]
  education: CvEducation[]
  languages: CvLanguage[]
  about: CvAbout
}

export const cv: Cv = {
  person: {
    name: 'Marvin Vrdoljak',
    role: {
      de: 'Senior Developer',
      en: 'Senior Developer',
    },
    location: 'Emsdetten, Deutschland',
    birthDate: '1992-02-23',
    email: 'marvin@vrdoljak.de',
    photo: '/portrait.jpg',
    links: [
      {
        id: 'lnk-01',
        label: 'linkedin.com/in/marvin-vrdoljak',
        href: 'https://www.linkedin.com/in/marvin-vrdoljak/',
      },
    ],
  },

  profile: {
    id: 'pro-01',
    text: {
      de: 'Zwischen Design und Entwicklung gibt es eine Lücke, an der viele Projekte hängen bleiben. Ich arbeite seit über zehn Jahren auf beiden Seiten davon, mit Designhintergrund aus dem Studium und der Umsetzung als Beruf.\nKI hat die Grenze verschoben, was eine einzelne Person umsetzen kann. Genau deshalb baue ich neben der Arbeit für Kunden eigene Produkte, von der Idee über Design und Entwicklung bis zum fertigen Release.',
      en: 'Between design and development there is a gap where many projects stall. I have worked on both sides of it for over ten years, with a design background from my studies and building things as my profession.\nAI has moved the line of what a single person can ship. That is exactly why, alongside client work, I build my own products — from the idea through design and development to the finished release.',
    },
  },

  experience: [
    {
      id: 'exp-01',
      from: '2019-07',
      to: null,
      role: {de: 'Senior Developer', en: 'Senior Developer'},
      organisation: 'DU DA · Vollzeit',
      organisationHref: 'https://dudagroup.com/',
      location: 'Zürich, Schweiz',
      summary: {
        de: 'Frontend- und Produktentwicklung in der Agentur; 2019 als Developer eingestiegen, 2022 zum Senior Developer aufgestiegen.',
        en: 'Agency frontend and product development; joined as Developer in 2019, promoted to Senior Developer in 2022.',
      },
      highlights: [
        {
          de: 'Produktoberflächen mit React, Next.js und TypeScript, angebunden an ein Payload-CMS.',
          en: 'Product interfaces with React, Next.js and TypeScript, wired to a Payload CMS.',
        },
        {
          de: 'Konzeptionelle Arbeit von Wireframes über Prototypen bis zur Umsetzung, eng mit der Gestaltung verzahnt.',
          en: 'Conceptual work from wireframes through prototypes to implementation, tightly interwoven with design.',
        },
        {
          de: 'KI-gestützte Entwicklung im Alltag: große Sprachmodelle, Prompt-Engineering und Claude Code als Teil des Workflows.',
          en: 'AI-assisted development day to day: large language models, prompt engineering and Claude Code as part of the workflow.',
        },
      ],
      stack: ['React', 'Next.js', 'TypeScript', 'Payload CMS', 'Three.js', 'WordPress', 'Figma'],
    },
    {
      id: 'exp-02',
      from: '2025-01',
      to: null,
      role: {de: 'Product Engineer', en: 'Product Engineer'},
      organisation: 'Selbstständig',
      location: 'Zürich, Schweiz',
      summary: {
        de: 'Entwicklung eigener iOS- und Web-Produkte, von der Idee bis zum Release.',
        en: 'Building my own iOS and web products, from idea through to release.',
      },
      highlights: [
        {
          de: 'Eigene Produkte mit React Native/Expo, Next.js und Supabase — Konzept, Design, Umsetzung und Auslieferung in einer Hand.',
          en: 'Own products with React Native/Expo, Next.js and Supabase — concept, design, build and release in one pair of hands.',
        },
        {
          de: 'KI-gestützte Entwicklung als durchgängiger Teil des Workflows.',
          en: 'AI-assisted development woven through the whole workflow.',
        },
      ],
      stack: ['React Native', 'Expo', 'Next.js', 'Supabase', 'TypeScript', 'Figma'],
    },
    {
      id: 'exp-03',
      from: '2017-02',
      to: '2019-06',
      role: {de: 'Frontend Developer', en: 'Frontend Developer'},
      organisation: 'Farner Consulting AG · Vollzeit',
      organisationHref: 'https://www.farner.ch/',
      location: 'Zürich, Schweiz',
      summary: {
        de: 'Frontend-Entwicklung in der Kommunikationsberatung, Schwerpunkt WordPress-basierte Websites.',
        en: 'Frontend development at a communications consultancy, focused on WordPress-based websites.',
      },
      highlights: [
        {
          de: 'Websites und Themes auf WordPress-Basis gestaltet und umgesetzt.',
          en: 'Designed and built websites and themes on WordPress.',
        },
        {
          de: 'Frontend-Umsetzung eng an Gestaltung und User Experience gekoppelt.',
          en: 'Frontend work tied closely to design and user experience.',
        },
      ],
      stack: ['WordPress', 'JavaScript', 'HTML', 'CSS', 'User Experience (UX)'],
    },
    {
      id: 'exp-04',
      from: '2015-01',
      to: '2017-01',
      role: {de: 'Frontend Developer', en: 'Frontend Developer'},
      organisation: 'arndtteunissen GmbH · Vollzeit',
      organisationHref: 'https://www.arndtteunissen.de/',
      location: 'Düsseldorf, Deutschland',
      summary: {
        de: 'Frontend-Entwicklung in Vollzeit, Schwerpunkt CMS-basierte Websites mit TYPO3 und Contao.',
        en: 'Full-time frontend development, focused on CMS-based websites with TYPO3 and Contao.',
      },
      highlights: [
        {
          de: 'Websites auf Basis von TYPO3 und Contao gestaltet und umgesetzt.',
          en: 'Designed and built websites on TYPO3 and Contao.',
        },
        {
          de: 'Styling mit Sass, HTML und CSS.',
          en: 'Styling with Sass, HTML and CSS.',
        },
      ],
      stack: ['TYPO3', 'Contao', 'Sass', 'JavaScript', 'HTML', 'CSS'],
    },
    {
      id: 'exp-05',
      from: '2013-09',
      to: '2014-01',
      role: {de: 'Webdesigner · Praktikum', en: 'Web Designer · Internship'},
      organisation: 'Interactive Investor Pty Ltd',
      location: 'Sydney, Australien',
      summary: {
        de: 'Praktikum im Webdesign in Sydney; Gestaltung und Frontend-Umsetzung.',
        en: 'Web design internship in Sydney; design and frontend implementation.',
      },
      highlights: [
        {
          de: 'Erste berufliche Station mit Fokus auf User Experience und JavaScript.',
          en: 'First professional role, focused on user experience and JavaScript.',
        },
      ],
      stack: ['User Experience (UX)', 'JavaScript', 'HTML', 'CSS'],
    },
  ],

  /* `card: true` marks the terms the one-page card prints — the daily work.
     Left off on purpose: the generic umbrellas (Frontend-Entwicklung,
     Webentwicklung) because the concrete frameworks next to them say it
     better; Three.js and Claude Code as too narrow for a first impression;
     SQL/SQLite/MongoDB because one database is the honest claim here (see the
     note); and the four clouds, because the note below says there is no
     enterprise-infrastructure specialisation and a card cannot carry a note. */
  skills: [
    {
      id: 'skl-01',
      label: {de: 'Sprachen & Fundament', en: 'Languages & fundamentals'},
      items: [
        {name: 'TypeScript', card: true},
        {name: 'JavaScript', card: true},
        {name: 'HTML', card: true},
        {name: 'CSS', card: true},
      ],
      note: null,
    },
    {
      id: 'skl-02',
      label: {de: 'Frameworks & Frontend', en: 'Frameworks & frontend'},
      items: [
        {name: 'React.js', card: true},
        {name: 'Next.js', card: true},
        {name: 'React Native', card: true},
        {name: 'Expo', card: true},
        {name: 'Three.js'},
        {name: 'Frontend-Entwicklung'},
        {name: 'Webentwicklung'},
      ],
      note: null,
    },
    {
      id: 'skl-03',
      label: {de: 'KI-gestützte Entwicklung', en: 'AI-assisted development'},
      items: [
        {name: 'Künstliche Intelligenz (KI)', card: true},
        {name: 'Große Sprachmodelle (LLM)', card: true},
        {name: 'KI-gestützte Softwareentwicklung', card: true},
        {name: 'Prompt-Engineering'},
        {name: 'Claude Code'},
      ],
      note: null,
    },
    {
      id: 'skl-04',
      label: {de: 'Design & Konzeption', en: 'Design & concept'},
      items: [
        {name: 'User Experience (UX)', card: true},
        {name: 'Konzeption', card: true},
        {name: 'Wireframing', card: true},
        {name: 'Figma', card: true},
        {name: 'Digitale Barrierefreiheit', card: true},
      ],
      note: null,
    },
    {
      id: 'skl-05',
      label: {de: 'Werkzeuge & Arbeitsweise', en: 'Tooling & ways of working'},
      items: [
        {name: 'WordPress', card: true},
        {name: 'Payload CMS', card: true},
        {name: 'REST-API', card: true},
        {name: 'Git', card: true},
        {name: 'CI/CD'},
        {name: 'Vercel'},
        {name: 'Scrum', card: true},
      ],
      note: null,
    },
    {
      id: 'skl-06',
      label: {de: 'Datenbanken', en: 'Databases'},
      items: [{name: 'SQL'}, {name: 'PostgreSQL'}, {name: 'SQLite'}, {name: 'MongoDB'}],
      note: {
        de: 'Kein Datenbank-Spezialist, aber das Aufsetzen und Bearbeiten von Datenbanken gelingt problemlos.',
        en: 'No database specialist, but setting up and working with databases is no problem.',
      },
    },
    {
      id: 'skl-07',
      label: {de: 'Cloud & Betrieb', en: 'Cloud & operations'},
      items: [
        {name: 'Microsoft Azure'},
        {name: 'Amazon Web Services (AWS)'},
        {name: 'Google Cloud'},
        {name: 'Cloudflare'},
        {name: 'Expo Application Services (EAS)'},
      ],
      note: {
        de: 'Projektbezogen eingesetzt, solide im Anwendungsbetrieb – ohne Spezialisierung auf große Enterprise-Infrastruktur.',
        en: 'Used on projects, solid at application-level operations — without specialising in large enterprise infrastructure.',
      },
    },
  ],

  education: [
    {
      id: 'edu-01',
      from: '2011-09',
      to: '2015-06',
      qualification: {
        de: 'Bachelor of Arts (B.A.), Mediadesign',
        en: 'Bachelor of Arts (BA), Media Design',
      },
      institution: 'Mediadesign Hochschule für Design und Informatik',
      note: null,
    },
    {
      id: 'edu-02',
      from: '2024-03',
      to: '2024-03',
      qualification: {
        de: 'Conduct UX Research and Test Early Concepts',
        en: 'Conduct UX Research and Test Early Concepts',
      },
      institution: 'Coursera',
      note: null,
      href: 'https://www.coursera.org/account/accomplishments/verify/PPDSLD7TXRNH',
      credentialId: 'PPDSLD7TXRNH',
    },
    {
      id: 'edu-03',
      from: '2024-02',
      to: '2024-02',
      qualification: {
        de: 'Build Wireframes and Low-Fidelity Prototypes',
        en: 'Build Wireframes and Low-Fidelity Prototypes',
      },
      institution: 'Coursera',
      note: null,
      href: 'https://www.coursera.org/account/accomplishments/verify/3S99EAHL2XL6',
      credentialId: '3S99EAHL2XL6',
    },
    {
      id: 'edu-04',
      from: '2024-01',
      to: '2024-01',
      qualification: {
        de: 'Start the UX Design Process: Empathize, Define, and Ideate',
        en: 'Start the UX Design Process: Empathize, Define, and Ideate',
      },
      institution: 'Coursera',
      note: null,
      href: 'https://www.coursera.org/account/accomplishments/verify/VNJEKJ5VNTR8',
      credentialId: 'VNJEKJ5VNTR8',
    },
    {
      id: 'edu-05',
      from: '2024-01',
      to: '2024-01',
      qualification: {
        de: 'Foundations of User Experience (UX) Design',
        en: 'Foundations of User Experience (UX) Design',
      },
      institution: 'Coursera',
      note: null,
      href: 'https://www.coursera.org/account/accomplishments/verify/QZAXE37KBGD4',
      credentialId: 'QZAXE37KBGD4',
    },
  ],

  languages: [
    {
      id: 'lng-01',
      language: {de: 'Deutsch', en: 'German'},
      level: {de: 'Muttersprache', en: 'Native'},
    },
    {
      id: 'lng-02',
      language: {de: 'Englisch', en: 'English'},
      level: {de: 'Verhandlungssicher', en: 'Professional working'},
    },
  ],
  about: {
    projects: [
      {
        id: 'lexilock',
        name: 'LexiLock',
        description: {
          de: 'Eigene iOS-App: Vor dem Öffnen ausgewählter Apps wie Instagram oder TikTok schiebt sich eine kurze Vokabelabfrage dazwischen. Konzept, Design, Entwicklung und Vermarktung allein verantwortet. Verfügbar in Deutsch, Englisch und Spanisch.',
          en: 'Own iOS app: a short vocabulary quiz appears before selected apps like Instagram or TikTok open. Sole responsibility for concept, design, development and go-to-market. Available in German, English and Spanish.',
        },
        href: 'https://lexilock.com/de',
        stack: ['React Native', 'Expo', 'TypeScript', 'SQLite', 'RevenueCat'],
      },
      {
        id: 'duda',
        name: 'DU DA',
        description: {
          de: 'Website der Agentur. Konzept, Design und Umsetzung.',
          en: 'Agency website. Concept, design and implementation.',
        },
        href: 'https://dudagroup.com/',
        stack: ['JavaScript', 'WordPress', 'Three.js', 'HTML', 'CSS'],
      },
      {
        id: 'zinsli',
        name: 'Zinsli',
        description: {
          de: 'Konzept, Design und Umsetzung.',
          en: 'Concept, design and implementation.',
        },
        href: 'https://www.zinsli.com/',
        stack: ['Next.js', 'React', 'Payload CMS', 'HTML', 'CSS'],
      },
      {
        id: 'hamilton-jobs',
        name: 'Hamilton Careers',
        description: {
          de: 'Karriereportal. Konzept, Design und Umsetzung.',
          en: 'Careers portal. Concept, design and implementation.',
        },
        href: 'https://jobs.hamilton.ch/',
        stack: ['JavaScript', 'WordPress', 'Three.js', 'HTML', 'CSS'],
      },
      {
        id: 'agency-clients',
        name: 'Kundenprojekte (Auswahl)',
        description: {
          de: 'Weitere Projekte im Agenturkontext, unter anderem für Tamedia, HBL, Zürcher Blutspendedienst, Micasa, Bundesamt für Gesundheit (BAG) und PostFinance.',
          en: 'Further agency projects, including work for Tamedia, HBL, Zurich Blood Donation Service, Micasa, the Swiss Federal Office of Public Health (BAG) and PostFinance.',
        },
        stack: [],
      },
    ],
    interests: [
      {de: 'Kitesurfen', en: 'Kitesurfing'},
      {de: 'Snowboarden', en: 'Snowboarding'},
      {de: 'Wakeboarden', en: 'Wakeboarding'},
      {de: 'Golf', en: 'Golf'},
      {de: 'Pflanzliche Ernährung und Kochen', en: 'Plant-based food and cooking'},
      {de: 'Eigene Produkte bauen', en: 'Building my own products'},
    ],
    strengths: [
      {
        de: 'Design und Entwicklung in einer Person. Mediadesign studiert, seit über zehn Jahren als Entwickler tätig – liest ein Figma-File nicht nur als Vorgabe, sondern versteht die gestalterische Absicht dahinter.',
        en: 'Design and development in one person. Studied media design, over ten years as a developer – reads a Figma file not just as a spec but understands the intent behind it.',
      },
      {
        de: 'Hoher Qualitätsanspruch bis ins Detail – in Gestaltung, Code und Interaktion. Misst Arbeit am fertigen Ergebnis, nicht am ersten Wurf.',
        en: 'A high bar for quality down to the detail – in design, code and interaction. Judges work by the finished result, not the first pass.',
      },
      {
        de: 'Produkte allein bis zum Release gebracht: Konzept, Design, Entwicklung, Pricing, App Store, Vermarktung.',
        en: 'Has taken products to release single-handedly: concept, design, development, pricing, App Store, go-to-market.',
      },
      {
        de: 'Trifft Entscheidungen gegen Features und gegen Projekte. Hat eine eigene App nach Auswertung der Zahlen bewusst eingestellt, statt sie weiterlaufen zu lassen.',
        en: 'Makes decisions against features and against projects. Deliberately shut down one of his own apps after reviewing the numbers instead of letting it run on.',
      },
      {
        de: 'Arbeitet KI-nativ und kann konkret benennen, wo er den Ergebnissen nicht traut.',
        en: 'Works AI-natively and can point precisely to where he does not trust the output.',
      },
      {
        de: 'Hat sich über elf Jahre mehrfach neu aufgestellt: von WordPress und jQuery über React und Next.js bis zu React Native und KI-gestützter Entwicklung.',
        en: 'Has repositioned himself several times over eleven years: from WordPress and jQuery to React and Next.js, and on to React Native and AI-assisted development.',
      },
      {
        de: 'Mehrsprachigkeit und Internationalisierung von Anfang an mitgedacht, nicht nachträglich ergänzt.',
        en: 'Builds multilingual products from the start rather than retrofitting internationalisation.',
      },
      {
        de: 'Agenturerfahrung mit Kunden aus Medien, Gesundheitswesen, Finanzsektor und öffentlicher Hand – gewohnt, technische Entscheidungen gegenüber Nicht-Technikern zu vertreten.',
        en: 'Agency experience with clients in media, healthcare, finance and the public sector – used to defending technical decisions to non-technical stakeholders.',
      },
    ],
    weaknesses: [
      {
        de: 'Kein Backend-Architekt. Datenbanken und Serverlogik so tief, wie das eigene Produkt es braucht',
        en: 'Not a backend architect. Databases and server logic go as deep as his own products require.',
      },
      {
        de: 'Kein Hintergrund in Machine Learning oder Data Engineering. Nutzt KI als Werkzeug in der Anwendungsentwicklung, baut aber keine Modelle.',
        en: 'No machine learning or data engineering background. Uses AI as a tool in application development but does not build models.',
      },
      {
        de: 'Erfahrung fast ausschließlich in Agenturen und Solo-Projekten. Große Konzernstrukturen mit langen Abstimmungswegen sind ihm fremd.',
        en: 'Experience almost entirely in agencies and solo projects. Large corporate structures with long approval chains are unfamiliar territory.',
      },
      {
        de: 'Bisher keine disziplinarische Führungsverantwortung. Fachliche Anleitung ja, Teamleitung nein.',
        en: 'No line management experience so far. Technical guidance yes, team leadership no.',
      },
      {
        de: 'Kein DevOps- oder Infrastruktur-Spezialist. CI/CD läuft in der Praxis über Vercel und EAS; AWS, Microsoft Azure, Google Cloud und Cloudflare hat er projektbezogen eingesetzt – solide im Anwendungsbetrieb, aber ohne Spezialisierung auf große Enterprise-Infrastruktur.',
        en: 'Not a DevOps or infrastructure specialist. CI/CD runs in practice through Vercel and EAS; has used AWS, Microsoft Azure, Google Cloud and Cloudflare on projects – solid at application-level operations, but not specialised in large enterprise infrastructure.',
      },
    ],
    extra: [
      {
        de: 'Cloud und Deployment in der Praxis: CI/CD über Vercel und EAS; AWS, Microsoft Azure, Google Cloud und Cloudflare projektbezogen eingesetzt – vorhanden, aber ohne Spezialisierung.',
        en: 'Cloud and deployment in practice: CI/CD via Vercel and EAS; has used AWS, Microsoft Azure, Google Cloud and Cloudflare on projects – present, but not a specialisation.',
      },
      {
        de: 'Arbeitet seit Jahren in agilen Teams nach Scrum: Sprints, Dailies, Refinements, Retrospektiven. Als Entwickler im Team, nicht als Scrum Master.',
        en: 'Has worked in agile Scrum teams for years: sprints, dailies, refinements, retrospectives. As a developer on the team, not as Scrum Master.',
      },
      {
        de: 'Zieht Ende 2026 von Zürich nach Emsdetten (Raum Münster).',
        en: 'Relocating from Zurich to Emsdetten (Münster area) in late 2026.',
      },
      {
        de: 'Sucht eine Festanstellung in Deutschland, vor Ort im Raum Münster oder remote.',
        en: 'Looking for a permanent role in Germany, on-site around Münster or remote.',
      },
      {de: 'Verfügbar ab 1. Januar 2027.', en: 'Available from January 1, 2027.'},
      {
        de: 'Deutscher Staatsbürger, keine Arbeitserlaubnis nötig.',
        en: 'German citizen, no work permit required.',
      },
      {de: 'Führerschein Klasse B', en: 'Driving licence (category B)'},
      {
        de: 'Arbeitet seit über zehn Jahren im Agenturumfeld: Kundenkommunikation, Pitches, wechselnde Branchen.',
        en: 'Over ten years in agency environments: client communication, pitches, varied industries.',
      },
    ],
  },
}
