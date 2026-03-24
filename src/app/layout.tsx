import type { Metadata } from 'next'

import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'], weight: ['400','500','600'],
  style: ['normal','italic'], variable: '--font-serif', display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'], weight: ['300','400','500','600'],
  variable: '--font-sans', display: 'swap',
})

export const metadata: Metadata = {
  title: 'Segment Intelligence — SWOT Explorer',
  description: 'AI-powered segment analysis by Ayushi Patel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
