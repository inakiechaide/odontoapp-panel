import type { Metadata, Viewport } from 'next'
import { Inter, Spectral } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/shared/Providers'

const inter = Inter({ subsets: ['latin'] })
const spectral = Spectral({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: 'OdontoApp — Panel Administrativo',
  description: 'Sistema de gestión odontológica para AMBA',
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <body className={`${inter.className} ${spectral.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
