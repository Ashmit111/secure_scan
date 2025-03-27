"use client"

import React, { useState } from "react"
import axios from "axios"
import { Shield, ShieldCheck, ShieldAlert, ExternalLink, ChevronRight, Lock, Eye, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import Particles from "@/components/particles"

export default function PhishingDetector() {
  const [url, setUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!url) return

    setIsAnalyzing(true)
    setProgress(0)
    setResult(null)

    // Send URL to backend as a POST request
    axios.post("/api/analyze", { url })
      .then(response => {
        console.log("Backend response:", response.data)
      })
      .catch(error => {
        console.error("Error sending URL:", error)
      })

    // Simulate analysis with progress updates
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 15
        if (newProgress >= 100) {
          clearInterval(interval)
          setIsAnalyzing(false)

          // Mock result - in a real app, this would come from an API
          const isSafe = Math.random() > 0.5
          setResult({
            safe: isSafe,
            score: isSafe ? Math.floor(Math.random() * 20) : 70 + Math.floor(Math.random() * 30),
            details: isSafe
              ? ["Domain age verification passed", "SSL certificate valid", "No suspicious redirects"]
              : ["Suspicious URL structure", "Domain recently registered", "Mimics legitimate brand"],
          })
          return 100
        }
        return newProgress
      })
    }, 300)
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
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary">
              How It Works
            </Link>
            <Link href="#about" className="text-sm font-medium hover:text-primary">
              About
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

      <main className="flex-1 ">
        {/* Hero Section with Scanner */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted py-20 pl-44 ml-10">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container relative z-10">
            <div className="mx-auto max-w-3xl text-center mb-10">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Detect <span className="text-primary">Phishing</span> Websites Instantly
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Protect yourself from online scams. Our advanced AI technology scans and identifies malicious websites
                before you become a victim.
              </p>
            </div>

            <Card className="mx-auto max-w-2xl border-2 shadow-lg">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <ExternalLink className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="url"
                        placeholder="Paste suspicious URL here..."
                        className="pl-10"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="transition-all duration-300 hover:scale-105"
                      disabled={isAnalyzing || !url}
                    >
                      {isAnalyzing ? "Analyzing..." : "Scan Now"}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  {isAnalyzing && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Analyzing URL security...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {result && (
                    <div
                      className={`mt-6 rounded-lg p-4 ${result.safe ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"}`}
                    >
                      <div className="flex items-center">
                        {result.safe ? (
                          <ShieldCheck className="h-8 w-8 text-green-500" />
                        ) : (
                          <ShieldAlert className="h-8 w-8 text-red-500" />
                        )}
                        <div className="ml-3">
                          <h3 className="text-lg font-medium">
                            {result.safe ? "Website appears safe" : "Potential phishing detected!"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {result.safe
                              ? "Our scan found no suspicious elements on this website."
                              : "This URL shows characteristics commonly found in phishing websites."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium">Risk Score</span>
                          <span className={`text-sm font-bold ${result.safe ? "text-green-600" : "text-red-600"}`}>
                            {result.score}/100
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${result.safe ? "bg-green-500" : "bg-red-500"}`}
                            style={{ width: `${result.score}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Analysis Details:</h4>
                        <ul className="space-y-1">
                          {result.details.map((detail, index) => (
                            <li key={index} className="text-sm flex items-start">
                              <span className="mr-2 mt-0.5">•</span> {detail}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {!result.safe && (
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-sm text-red-600 font-medium flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            We recommend not visiting this website
                          </p>
                          <Button variant="outline" size="sm" className="text-xs">
                            Report False Positive
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Animated particles */}
          <div id="particles-container" className="absolute inset-0 pointer-events-none"></div>
          <Particles />
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-background pl-44">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Advanced Phishing Protection</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Our technology uses multiple detection methods to identify even the most sophisticated phishing
                attempts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Eye className="h-10 w-10 text-primary" />}
                title="Visual Analysis"
                description="Detects visual similarities to legitimate websites that might fool users."
              />
              <FeatureCard
                icon={<Lock className="h-10 w-10 text-primary" />}
                title="SSL Verification"
                description="Checks for proper security certificates and encryption protocols."
              />
              <FeatureCard
                icon={<AlertTriangle className="h-10 w-10 text-primary" />}
                title="Behavior Monitoring"
                description="Identifies suspicious redirect patterns and malicious code execution."
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-muted pl-40">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How SecureScan Works</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Our multi-layered approach ensures comprehensive protection against phishing attempts.
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-1/2 h-full -translate-x-1/2 bg-border"></div>

              {/* Reduced width for step cards */}
              <div className="space-y-12 w-1/2 mx-auto">
                <StepCard
                  number={1}
                  title="URL Analysis"
                  description="We examine the URL structure to identify suspicious patterns, typosquatting, and deceptive domains."
                />
                <StepCard
                  number={2}
                  title="Content Scanning"
                  description="Our system analyzes the website content for known phishing indicators and malicious code."
                />
                <StepCard
                  number={3}
                  title="Reputation Check"
                  description="We cross-reference with our database of known phishing sites and trusted domains."
                />
                <StepCard
                  number={4}
                  title="AI-Powered Assessment"
                  description="Our machine learning algorithms evaluate all factors to provide a comprehensive risk score."
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground pl-44">
          <div className="container text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">Stay Protected Online</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
              Sign up for our premium service to get real-time protection, browser extensions, and email scanning.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg">
                Get Premium
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Learn More
              </Button>
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
            <nav className="flex gap-8 mb-4 md:mb-0">
              <Link href="#" className="text-sm hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm hover:text-primary">
                Terms of Service
              </Link>
              <Link href="#" className="text-sm hover:text-primary">
                Contact Us
              </Link>
            </nav>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SecureScan. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-6 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function StepCard({ number, title, description }) {
  return (
    <div className="relative pl-10 md:pl-0">
      <div className="md:grid md:grid-cols-5 md:gap-8">
        <div className="md:col-span-1 flex md:justify-end">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold relative z-10">
            {number}
          </div>
        </div>
        <Card className="md:col-span-4 mt-3 md:mt-0">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
