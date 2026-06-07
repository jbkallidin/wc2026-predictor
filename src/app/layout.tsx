import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WC 2026 Predictor',
  description: 'Predict every match of the 2026 FIFA World Cup',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  )
}
