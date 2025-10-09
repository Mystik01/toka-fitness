import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Full Stack App',
  description: 'Next.js + Flask full stack application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}