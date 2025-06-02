import type React from "react"
import type { Metadata } from "next"
import { Lexend_Deca } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Toaster } from "@/components/ui/toaster"

const lexendDeca = Lexend_Deca({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Googly Forms - Create Beautiful Forms",
  description: "Create and share forms easily with Googly Forms",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={lexendDeca.className}>
        <AuthProvider>
          <ProtectedRoute>
            <Header />
            <main className="min-h-screen bg-gradient-to-br from-purple-50/30 via-blue-50/30 to-indigo-100/30">
              {children}
            </main>
          </ProtectedRoute>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
