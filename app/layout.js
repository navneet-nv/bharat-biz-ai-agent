import { Outfit } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
})

export const metadata = {
  title: 'Bharat Biz-Agent | AI-Powered Business Assistant',
  description: 'AI-powered business assistant for Indian SMBs. Manage invoices, payments, and customers with voice support in Hindi, Hinglish, and English.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-sans antialiased bg-slate-50 relative overflow-hidden min-h-screen">
        {/* Ambient Background Animation */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-blob mix-blend-multiply opacity-70" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-2000 mix-blend-multiply opacity-70" />
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-blob animation-delay-4000 mix-blend-multiply opacity-70" />
        </div>

        {children}
        <Toaster position="top-right" richColors theme="light" closeButton />
      </body>
    </html>
  )
}