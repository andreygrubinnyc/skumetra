import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://skumetra.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Skumetra — Supplier-Aware Protection for Amazon Sellers',
    template: '%s — Skumetra',
  },
  description:
    'Compare supplier inventory and costs with Amazon listings, calculate safe selling prices, and identify products that need attention.',
  applicationName: 'Skumetra',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Skumetra',
    title: 'Skumetra — Supplier-Aware Protection for Amazon Sellers',
    description:
      'Compare supplier inventory and costs with Amazon listings, calculate safe selling prices, and identify products that need attention.',
  },
  twitter: {
    card: 'summary',
    title: 'Skumetra — Supplier-Aware Protection for Amazon Sellers',
    description:
      'Compare supplier inventory and costs with Amazon listings, calculate safe selling prices, and identify products that need attention.',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <a
          href="#main-content"
          className="sr-only rounded-control focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-accent focus:px-4 focus:py-2.5 focus:text-white focus:no-underline"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
