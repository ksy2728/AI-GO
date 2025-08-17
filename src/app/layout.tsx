import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Navigation } from '@/components/navigation'
import { LanguageProvider } from '@/contexts/LanguageContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI-GO - Global AI Model Monitoring Platform',
  description: 'Real-time monitoring of AI model performance, availability, benchmarks, and industry news from around the world.',
  keywords: ['AI', 'machine learning', 'monitoring', 'benchmarks', 'API'],
  authors: [{ name: 'AI-GO Team' }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <Navigation />
          <main className="min-h-screen">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  )
}