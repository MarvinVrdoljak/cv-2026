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
  /** Where the work was done — city, country. */
  location: string
  /** One sentence. What the role was, not how great it went. */
  summary: LocalizedText
  highlights: LocalizedText[]
  stack: string[]
}

export type CvSkillGroup = {
  id: string
  label: LocalizedText
  items: string[]
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
}

export type CvLanguage = {
  id: string
  language: LocalizedText
  /** CEFR level or a plain word — no bars, no percentages. */
  level: LocalizedText
}

export type Cv = {
  person: {
    name: string
    role: LocalizedText
    location: string
    email: string
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
}

export const cv: Cv = {
  person: {
    name: 'Marvin Vrdoljak',
    role: {
      de: 'Senior Developer',
      en: 'Senior Developer',
    },
    location: 'Emsdetten, Deutschland',
    email: 'marvin@vrdoljak.de',
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
      de: 'Zwischen Design und Entwicklung gibt es eine Lücke, in der Projekte hängen bleiben. Ich arbeite seit über zehn Jahren auf beiden Seiten — mit gestalterischem Hintergrund aus dem Studium und Entwicklung als Beruf. Am stärksten bin ich dort, wo Design und Umsetzung nicht getrennt verhandelt werden, sondern von der Idee bis zum fertigen Release zusammengehören.',
      en: 'Between design and development there is a gap where projects stall. I have worked on both sides for over ten years — a design education from my studies, development as my profession. I am strongest where design and implementation are not negotiated separately but belong together, from the idea through to the finished release.',
    },
  },

  experience: [
    {
      id: 'exp-01',
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
          de: 'Eigene Produkte mit React Native/Expo, Next.js und Supabase — Konzept, Umsetzung und Auslieferung in einer Hand.',
          en: 'Own products with React Native/Expo, Next.js and Supabase — concept, build and release in one pair of hands.',
        },
        {
          de: 'LexiLock: iOS-App, die vor dem Öffnen ausgewählter Apps wie Instagram oder TikTok eine kurze Vokabelabfrage einschiebt.',
          en: 'LexiLock: an iOS app that inserts a short vocabulary quiz before opening chosen apps like Instagram or TikTok.',
        },
        {
          de: 'KI-gestützte Entwicklung als durchgängiger Teil des Workflows.',
          en: 'AI-assisted development woven through the whole workflow.',
        },
      ],
      stack: ['React Native', 'Expo', 'Next.js', 'Supabase', 'TypeScript', 'Figma (Software)'],
    },
    {
      id: 'exp-02',
      from: '2022-10',
      to: null,
      role: {de: 'Senior Developer', en: 'Senior Developer'},
      organisation: 'DU DA · Vollzeit',
      location: 'Zürich, Schweiz',
      summary: {
        de: 'Frontend- und Produktentwicklung in der Agentur mit React, Next.js und TypeScript — von der Gestaltung bis zur Auslieferung.',
        en: 'Agency frontend and product development with React, Next.js and TypeScript — from design through to release.',
      },
      highlights: [
        {
          de: 'Produktoberflächen mit React, Next.js und TypeScript, angebunden an ein Payload-CMS über REST-APIs.',
          en: 'Product interfaces with React, Next.js and TypeScript, wired to a Payload CMS over REST APIs.',
        },
        {
          de: 'Interaktive 3D- und Bewegungsanteile mit Three.js umgesetzt.',
          en: 'Built interactive 3D and motion elements with Three.js.',
        },
        {
          de: 'KI-gestützte Entwicklung im Alltag: große Sprachmodelle, Prompt-Engineering und Claude Code als Teil des Workflows.',
          en: 'AI-assisted development day to day: large language models, prompt engineering and Claude Code as part of the workflow.',
        },
        {
          de: 'Digitale Barrierefreiheit als fester Bestandteil der Umsetzung, nicht als nachgelagerte Prüfung.',
          en: 'Digital accessibility as a fixed part of implementation, not a downstream audit.',
        },
      ],
      stack: ['React', 'Next.js', 'TypeScript', 'Payload CMS', 'Three.js', 'Figma (Software)'],
    },
    {
      id: 'exp-03',
      from: '2019-07',
      to: '2022-10',
      role: {de: 'Developer', en: 'Developer'},
      organisation: 'DU DA · Vollzeit',
      location: 'Zürich, Schweiz',
      summary: {
        de: 'Frontend-Entwicklung in der Agentur; Schwerpunkt WordPress, wachsend in den modernen JavaScript-Stack.',
        en: 'Agency frontend development; focused on WordPress, growing into the modern JavaScript stack.',
      },
      highlights: [
        {
          de: 'Websites und Oberflächen für Kundenprojekte gestaltet und umgesetzt.',
          en: 'Designed and built websites and interfaces for client projects.',
        },
        {
          de: 'Übergang von WordPress hin zu komponentenbasierter Frontend-Entwicklung mitgetragen.',
          en: 'Helped carry the shift from WordPress toward component-based frontend development.',
        },
      ],
      stack: ['WordPress', 'JavaScript', 'CSS', 'User Experience (UX)'],
    },
    {
      id: 'exp-04',
      from: '2017-02',
      to: '2019-06',
      role: {de: 'Frontend Developer', en: 'Frontend Developer'},
      organisation: 'Farner Consulting AG · Vollzeit',
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
      id: 'exp-05',
      from: '2015-01',
      to: '2017-01',
      role: {de: 'Frontend Developer', en: 'Frontend Developer'},
      organisation: 'arndtteunissen GmbH · Vollzeit',
      location: 'Düsseldorf, Deutschland',
      summary: {
        de: 'Frontend-Entwicklung in Vollzeit, Schwerpunkt WordPress-basierte Websites.',
        en: 'Full-time frontend development, focused on WordPress-based websites.',
      },
      highlights: [
        {
          de: 'Websites und Themes auf WordPress-Basis gestaltet und umgesetzt.',
          en: 'Designed and built websites and themes on WordPress.',
        },
        {
          de: 'Styling mit Sass und handgeschriebenem HTML und CSS.',
          en: 'Styling with Sass and hand-written HTML and CSS.',
        },
      ],
      stack: ['WordPress', 'Sass', 'JavaScript', 'HTML', 'CSS'],
    },
    {
      id: 'exp-06',
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

  skills: [
    {
      id: 'skl-01',
      label: {de: 'Sprachen & Fundament', en: 'Languages & fundamentals'},
      items: ['TypeScript', 'JavaScript', 'HTML', 'CSS'],
      note: {
        de: 'TypeScript als Standard, aufbauend auf handgeschriebenem HTML und CSS.',
        en: 'TypeScript by default, built on hand-written HTML and CSS.',
      },
    },
    {
      id: 'skl-02',
      label: {de: 'Frameworks & Frontend', en: 'Frameworks & frontend'},
      items: [
        'React.js',
        'Next.js',
        'React Native',
        'Expo',
        'Three.js',
        'Frontend-Entwicklung',
        'Webentwicklung',
      ],
      note: {
        de: 'React-Ökosystem im Web und auf Mobil, bis hin zu 3D mit Three.js.',
        en: 'The React ecosystem across web and mobile, through to 3D with Three.js.',
      },
    },
    {
      id: 'skl-03',
      label: {de: 'KI-gestützte Entwicklung', en: 'AI-assisted development'},
      items: [
        'Künstliche Intelligenz (KI)',
        'Große Sprachmodelle (LLM)',
        'KI-gestützte Softwareentwicklung',
        'Prompt-Engineering',
        'Claude Code',
      ],
      note: {
        de: 'Große Sprachmodelle und Claude Code als Teil des täglichen Workflows.',
        en: 'Large language models and Claude Code as part of the daily workflow.',
      },
    },
    {
      id: 'skl-04',
      label: {de: 'Design & Barrierefreiheit', en: 'Design & accessibility'},
      items: ['User Experience (UX)', 'Figma (Software)', 'Digitale Barrierefreiheit'],
      note: {
        de: 'Gestalterische Ausbildung; Barrierefreiheit als Teil der Definition of Done.',
        en: 'Formal design training; accessibility as part of the definition of done.',
      },
    },
    {
      id: 'skl-05',
      label: {de: 'CMS, API & Werkzeuge', en: 'CMS, API & tooling'},
      items: ['WordPress', 'Payload CMS', 'REST-API', 'Git'],
      note: null,
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
      note: {
        de: 'Schwerpunkte Webentwicklung und HTML.',
        en: 'Focus on web development and HTML.',
      },
    },
    {
      id: 'edu-02',
      from: '2024-03',
      to: '2024-03',
      qualification: {
        de: 'Zertifikat: Conduct UX Research and Test Early Concepts',
        en: 'Certificate: Conduct UX Research and Test Early Concepts',
      },
      institution: 'Coursera',
      note: {
        de: 'Eines von vier UX-Zertifikaten (Google UX Design, Coursera).',
        en: 'One of four UX certificates (Google UX Design, Coursera).',
      },
    },
    {
      id: 'edu-03',
      from: '2024-02',
      to: '2024-02',
      qualification: {
        de: 'Zertifikat: Build Wireframes and Low-Fidelity Prototypes',
        en: 'Certificate: Build Wireframes and Low-Fidelity Prototypes',
      },
      institution: 'Coursera',
      note: null,
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
}
