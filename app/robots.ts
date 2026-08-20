import type {MetadataRoute} from 'next'

/**
 * Keep this personal CV out of every index — search engines and generative
 * engines alike. A blanket `*` disallow already covers every crawler, so the
 * named AI/LLM agents below are redundant for enforcement; they are listed to
 * state the intent plainly and to stay explicit even if a future rule ever
 * loosens `*`. robots.txt is only a request, though — the binding signal is
 * the `noindex` meta tag (layout metadata) and the `X-Robots-Tag` header
 * (next.config), which together cover HTML pages and the PDF/API routes.
 */
const aiCrawlers = [
  // OpenAI
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  // Anthropic
  'ClaudeBot',
  'anthropic-ai',
  'Claude-Web',
  // Google (AI training is a separate token from Googlebot)
  'Google-Extended',
  // Common Crawl — the corpus many models train on
  'CCBot',
  // Perplexity
  'PerplexityBot',
  'Perplexity-User',
  // Apple Intelligence
  'Applebot-Extended',
  // Meta
  'meta-externalagent',
  'FacebookBot',
  // Others that harvest for training
  'Amazonbot',
  'Bytespider',
  'cohere-ai',
  'Diffbot',
  'Omgilibot',
  'Timpibot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Everything, everyone: nothing here is meant to be crawled.
      {userAgent: '*', disallow: '/'},
      // The same, said by name for the generative-engine crawlers.
      ...aiCrawlers.map((userAgent) => ({userAgent, disallow: '/'})),
    ],
  }
}
