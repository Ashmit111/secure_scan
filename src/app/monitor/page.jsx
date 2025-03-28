"use client"

import React, { useState, useRef } from "react"
import axios from "axios"
import { Shield, AlertCircle, CheckCircle2, ExternalLink, ChevronRight, Clock, Globe, ActivitySquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import Particles from "@/components/particles"

export default function MonitorPage() {
  const [url, setUrl] = useState("")
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const resultRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!url) return

    setIsMonitoring(true)
    setProgress(0)
    setResult(null)
    resultRef.current = null

    // Start progress simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 20
        return newProgress >= 95 ? 95 : newProgress
      })
    }, 200)

    // Call the monitor API
    axios.get(`/api/monitor?url=${encodeURIComponent(url)}`)
      .then(response => {
        console.log("Monitor response:", response.data)
        clearInterval(interval)
        setIsMonitoring(false)
        setProgress(100)
        setResult(response.data)
        resultRef.current = response.data
      })
      .catch(error => {
        console.error("Error monitoring URL:", error)
        clearInterval(interval)
        setIsMonitoring(false)
        setResult({
          url: url,
          status: 0,
          isUp: false,
          responseTime: "0ms",
          error: error.message || "Failed to monitor URL"
        })
      })
  }

  const renderStatusBadge = (status) => {
    if (status >= 200 && status < 300) {
      return <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs font-medium">
        {status}
      </span>
    } else if (status >= 300 && status < 400) {
      return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium">
        {status}
      </span>
    } else if (status >= 400) {
      return <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs font-medium">
        {status}
      </span>
    } else {
      return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 text-xs font-medium">
        {status}
      </span>
    }
  }

  const renderResultCard = () => {
    if (!result) return null
    
    return (
      <div className={`mt-6 rounded-lg p-5 ${
        result.isUp ? "bg-green-50 dark:bg-green-900/10" : "bg-red-50 dark:bg-red-900/10"
      }`}>
        <div className="flex items-center">
          {result.isUp ? (
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          ) : (
            <AlertCircle className="h-8 w-8 text-red-500" />
          )}
          <div className="ml-3">
            <h3 className="text-lg font-medium">
              {result.isUp ? "Website is Up" : "Website is Down"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {result.isUp 
                ? `The website responded in ${result.responseTime}`
                : `The website is unreachable or returned an error: ${result.error || 'Unknown error'}`
              }
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="bg-background/50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">URL</h4>
            </div>
            <p className="text-sm break-all">{result.url}</p>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <ActivitySquare className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Status</h4>
            </div>
            <div className="flex items-center">
              {renderStatusBadge(result.status)}
              <span className="ml-2 text-sm">{
                result.status >= 200 && result.status < 300 ? 'Success' :
                result.status >= 300 && result.status < 400 ? 'Redirection' :
                result.status >= 400 && result.status < 500 ? 'Client Error' :
                result.status >= 500 ? 'Server Error' : 'Unknown'
              }</span>
            </div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Response Time</h4>
            </div>
            <p className="text-xl font-semibold">{result.responseTime}</p>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Status</h4>
            </div>
            <div className={`text-lg font-semibold ${result.isUp ? "text-green-600" : "text-red-600"}`}>
              {result.isUp ? "Online" : "Offline"}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            variant="outline" 
            asChild
            className="text-sm"
          >
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              Visit Website
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pl-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SecureScan</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary">
              Phishing Detector
            </Link>
            <Link href="/monitor" className="text-sm font-medium text-primary">
              Website Monitor
            </Link>
          </nav>
          <div>
            <Button variant="outline" className="mr-2 hidden md:inline-flex">
              Log In
            </Button>
            <Button>Sign Up</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section with Monitor */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted py-20 pl-28">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container relative z-10">
            <div className="mx-auto max-w-3xl text-center mb-10">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Website <span className="text-primary">Monitoring</span> Tool
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Check if a website is up, monitor response times, and get real-time status updates.
              </p>
            </div>

            <Card className="mx-auto max-w-2xl border-2 shadow-lg">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="url"
                        placeholder="Enter website URL to monitor..."
                        className="pl-10"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="transition-all duration-300 hover:scale-105"
                      disabled={isMonitoring || !url}
                    >
                      {isMonitoring ? "Checking..." : "Check Status"}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  {isMonitoring && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Checking website status...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {renderResultCard()}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Animated particles */}
          <div id="particles-container" className="absolute inset-0 pointer-events-none"></div>
          <Particles />
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-background">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Website Monitoring Features</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Get instant insights into your website's availability and performance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-5 mx-auto">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-center">Uptime Monitoring</h3>
                <p className="text-muted-foreground text-center">Check if your websites are accessible to users around the world.</p>
              </div>

              <div className="bg-card rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-5 mx-auto">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-center">Response Time</h3>
                <p className="text-muted-foreground text-center">Monitor how fast your websites respond to user requests.</p>
              </div>

              <div className="bg-card rounded-lg p-6 border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-5 mx-auto">
                  <ActivitySquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-center">Status Codes</h3>
                <p className="text-muted-foreground text-center">Track HTTP status codes to identify specific issues with your site.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/50 pl-50">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">SecureScan</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SecureScan. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
