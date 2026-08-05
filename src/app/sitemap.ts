import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://skumetra.com'

/** Only public, indexable routes. /privacy and /terms are placeholders (noindex). */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/pilot`, changeFrequency: 'weekly', priority: 0.8 },
  ]
}
