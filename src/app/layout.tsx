import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Analytics } from '@/components/analytics'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
})

export const metadata: Metadata = {
  title: {
    default: 'PROTOGX Network - Ultra-Modern Blockchain Gaming Suite',
    template: '%s | PROTOGX Network'
  },
  description: '10 professional mini-games with AI agents, smart contracts, IPFS assets, and exclusive NFT rewards on MultiversX blockchain.',
  keywords: ['blockchain gaming', 'MultiversX', 'NFT', 'Web3', 'AI agents', 'DeFi', 'gaming', 'cryptocurrency'],
  authors: [{ name: 'George Pricop', url: 'https://github.com/Gzeu' }],
  creator: 'PROTOGX Network',
  publisher: 'PROTOGX Network',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://protogx.network'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'PROTOGX Network - Ultra-Modern Blockchain Gaming Suite',
    description: '10 professional mini-games with AI agents, smart contracts, IPFS assets, and exclusive NFT rewards.',
    url: 'https://protogx.network',
    siteName: 'PROTOGX Network',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PROTOGX Network Gaming Suite',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PROTOGX Network - Blockchain Gaming Suite',
    description: '10 professional mini-games with AI agents and NFT rewards on MultiversX.',
    creator: '@protogxnetwork',
    images: ['/og-image.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)', color: '#18181b' },
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${inter.variable} ${orbitron.variable}`}
    >
      <body className="min-h-screen bg-gradient-to-br from-dark-50 via-dark-100 to-dark-200 text-white antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}