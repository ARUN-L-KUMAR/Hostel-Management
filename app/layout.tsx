import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hostel Mess Management System',
  description: 'Complete hostel mess management solution',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`${GeistSans.className} overflow-x-hidden`}> {/* Added overflow-x-hidden */}
        <AuthProvider>
          <div className="min-h-screen max-w-full overflow-x-hidden"> {/* Added wrapper with constraints */}
            {children}
          </div>
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
