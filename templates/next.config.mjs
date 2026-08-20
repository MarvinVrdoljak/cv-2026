import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 16 otherwise appends a self-re-adding agent-rules block to CLAUDE.md
  // on every `next dev`; we keep CLAUDE.md hand-curated instead.
  agentRules: false,
}

export default withNextIntl(nextConfig)
