import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'DukaanKhata — QR Khata-Book for Local Shops',
  description:
    'Har dukaan ka apna QR code. Customer ka naam aur udhaar seconds mein add karein — no more paper diary. Free, fast, aur secure digital khata-book.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#9a3d1f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
