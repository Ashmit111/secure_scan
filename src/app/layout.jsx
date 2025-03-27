"use client"


import React, { useEffect, useState } from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

const metadata = {
  title: "PhishGuard - Detect Phishing Websites Instantly",
  description: "Protect yourself from online scams with our advanced phishing detection tool.",
}

export default function RootLayout({ children }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true) // Only on the client side
  }, [])

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        {/* Ensure ThemeProvider is only applied on client-side */}
        {isClient && (
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        )}
      </body>
    </html>
  )
}
