import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Skolia — Correction de copies',
  description: 'Assistant pédagogique pour la correction de copies',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
