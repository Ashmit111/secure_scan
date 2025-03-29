"use client"

import React, { useState, useRef } from "react"
import axios from "axios"
import { Shield, ShieldCheck, ShieldAlert, ExternalLink, ChevronRight, Lock, Eye, AlertTriangle, FileText, Globe, Calendar, Server, ActivitySquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import Particles from "@/components/particles"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function PhishingDetector() {
  const [url, setUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [isReportOpen, setIsReportOpen] = useState(false)
  
  // Replace detailedData state with a ref to avoid re-renders
  const detailedDataRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!url) return

    setIsAnalyzing(true)
    setProgress(0)
    setResult(null)
    // Clear the ref too
    detailedDataRef.current = null

    // Use absolute URL and add headers to ensure proper request formatting
    axios.post("/api/analyze", { url }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
      .then(response => {
        console.log("Backend response:", response.data);
        clearInterval(interval);
        setIsAnalyzing(false);
        
        // Process actual data from the backend
        const domainData = response.data.domainAnalysis?.data;
        const externalLinksData = response.data.externalLinksEvaluations || [];
        
        // Save detailed data in the ref instead of state
        detailedDataRef.current = {
          domainAnalysis: domainData,
          externalLinks: externalLinksData,
          url: url,
          timestamp: new Date().toISOString() // Add timestamp for debugging
        };
        
        // Use the risk score from the API instead of calculating it locally
        const riskScore = domainData?.risk_score || 
          (domainData?.is_domain_blacklisted ? 80 : 25);
        
        // Transform the data for UI display
        setResult({
          safe: domainData && !domainData.is_domain_blacklisted,
          score: riskScore,
          details: [
            domainData ? `Domain age: ${domainData.domain_age_days} days` : "Domain age unknown",
            domainData ? `SSL valid for: ${domainData.ssl_valid_days} days` : "SSL information unavailable",
            domainData ? `SSL issuer: ${domainData.ssl_issuer}` : "SSL issuer unknown",
            domainData ? `Google indexed: ${domainData.is_google_indexed ? "Yes" : "No"}` : "Google indexing unknown",
            `External links evaluated: ${externalLinksData.length}`
          ]
        });
      })
      .catch(error => {
        console.error("Error sending URL:", error);
        console.error("Error details:", error.response ? error.response.data : "No response data");
        console.error("Error status:", error.response ? error.response.status : "No status");
        clearInterval(interval);
        setIsAnalyzing(false);
        setResult({
          safe: false,
          score: 100,
          details: ["Failed to analyze the URL. Please try again later.", `Error: ${error.message || "Unknown error"}`],
        });
      });

    // Simulate progress updates
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 15;
        return newProgress >= 95 ? 95 : newProgress; // Cap at 95% until actual response
      });
    }, 300);
  }

  const handleViewDetailedReport = () => {
    console.log("Opening detailed report with cached data - no new API request");
    console.log("Cached data timestamp:", detailedDataRef.current?.timestamp);
    setIsReportOpen(true);
  };

  const renderResultCard = () => {
    if (!result) return null;
    
    return (
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

        <div className="mt-6 flex justify-center gap-2">
          <Button 
            variant="outline"
            type="button" 
            className="flex items-center gap-2"
            onClick={handleViewDetailedReport}
          >
            <FileText className="h-4 w-4" />
            View Detailed Report
          </Button>
          
          <Button 
            variant="outline"
            type="button" 
            className="flex items-center gap-2"
            asChild
          >
            <Link href={`/monitor?url=${encodeURIComponent(url)}`}>
              <ActivitySquare className="h-4 w-4" />
              Monitor Website
            </Link>
          </Button>
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
    );
  };

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
            <Link href="/monitor" className="text-sm font-medium hover:text-primary">
              Website Monitor
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
        <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted py-20 pl-28">
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

      {/* Detailed Report Sheet with black background */}
      <Sheet open={isReportOpen} onOpenChange={setIsReportOpen}>
        <SheetContent 
          size="lg" 
          className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto bg-black dark:bg-black border-l border-border"
        >
          <SheetHeader className="border-b pb-4 mb-5">
            <SheetTitle className="text-2xl font-bold flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Security Analysis Report
              <span className="ml-2 text-sm text-muted-foreground font-normal">(Using cached data)</span>
            </SheetTitle>
            <SheetDescription className="flex items-center">
              <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
              {detailedDataRef.current?.url || "URL Analysis"}
            </SheetDescription>
          </SheetHeader>

          {detailedDataRef.current ? (
            <Tabs defaultValue="summary" className="w-full">
              {/* Replace all instances of detailedData with detailedDataRef.current */}
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="domain">Domain Analysis</TabsTrigger>
                <TabsTrigger value="links">External Links</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-4 space-y-5">
                {/* Summary Tab */}
                <div className="bg-card p-4 rounded-lg border">
                  <div className="flex items-center mb-4">
                    {detailedDataRef.current.domainAnalysis?.is_domain_blacklisted === false ? (
                      <div className="bg-green-100 dark:bg-green-800/30 p-3 rounded-full">
                        <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <div className="bg-red-100 dark:bg-red-800/30 p-3 rounded-full">
                        <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                    )}
                    <div className="ml-4">
                      <h3 className="font-bold">
                        {detailedDataRef.current.domainAnalysis?.is_domain_blacklisted === false
                          ? "No significant threats detected"
                          : "Potential security concerns identified"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {detailedDataRef.current.domainAnalysis?.is_domain_blacklisted === false
                          ? "This domain appears to be safe based on our analysis."
                          : "This URL shows characteristics that may indicate phishing or malicious intent."}
                      </p>
                    </div>
                  </div>
                  
                  {/* Risk Score Indicator */}
                  <div className="mt-4 border-t pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Risk Score</span>
                      <span className={`text-sm font-bold ${
                        (detailedDataRef.current.domainAnalysis?.risk_score || 0) < 40 ? "text-green-600" : 
                        (detailedDataRef.current.domainAnalysis?.risk_score || 0) < 70 ? "text-yellow-600" : 
                        "text-red-600"
                      }`}>
                        {detailedDataRef.current.domainAnalysis?.risk_score || 0}/100
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted">
                      <div
                        className={`h-3 rounded-full ${
                          (detailedDataRef.current.domainAnalysis?.risk_score || 0) < 40 ? "bg-green-500" : 
                          (detailedDataRef.current.domainAnalysis?.risk_score || 0) < 70 ? "bg-yellow-500" : 
                          "bg-red-500"
                        }`}
                        style={{ width: `${detailedDataRef.current.domainAnalysis?.risk_score || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <InfoCard 
                      icon={<Calendar className="h-5 w-5 text-primary" />}
                      title="Domain Age"
                      value={typeof detailedDataRef.current.domainAnalysis?.domain_age_days === 'number'
                        ? `${detailedDataRef.current.domainAnalysis.domain_age_days} days`
                        : "Unknown"}
                      description="Older domains tend to be more trustworthy"
                    />
                    <InfoCard 
                      icon={<Lock className="h-5 w-5 text-primary" />}
                      title="SSL Certificate"
                      value={detailedDataRef.current.domainAnalysis?.ssl_issuer || "Unknown"}
                      description={`Valid for ${detailedDataRef.current.domainAnalysis?.ssl_valid_days || "?"} days`}
                    />
                    <InfoCard 
                      icon={<Globe className="h-5 w-5 text-primary" />}
                      title="Google Indexed"
                      value={detailedDataRef.current.domainAnalysis?.is_google_indexed === true ? "Yes" : "No"}
                      description="Indexed sites are generally more reputable"
                    />
                    <InfoCard 
                      icon={<Server className="h-5 w-5 text-primary" />}
                      title="External Links"
                      value={`${detailedDataRef.current.externalLinks?.length || 0} links analyzed`}
                      description="External connections may pose risks"
                    />
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Security Recommendation</h4>
                    <div className={`p-3 rounded-md ${
                      detailedDataRef.current.domainAnalysis?.is_domain_blacklisted === false
                        ? "bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300"
                        : "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300"
                    }`}>
                      {detailedDataRef.current.domainAnalysis?.is_domain_blacklisted === false
                        ? "This website appears safe to visit based on our security analysis."
                        : "Exercise caution with this website. It shows signs of potential security risks."}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="domain" className="mt-4 space-y-5">
                {/* Domain Analysis Tab */}
                <div className="bg-card rounded-lg border">
                  <div className="border-b p-4">
                    <h3 className="font-semibold">Domain Details</h3>
                    <p className="text-sm text-muted-foreground">Technical information about the domain</p>
                  </div>
                  
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detailedDataRef.current.domainAnalysis && Object.entries(detailedDataRef.current.domainAnalysis).map(([key, value]) => {
                      if (key !== "status") {
                        const formattedKey = key.replace(/_/g, ' ');
                        
                        return (
                          <div key={key} className="flex flex-col space-y-1 p-3 bg-muted/40 rounded-md">
                            <div className="text-xs font-medium uppercase text-muted-foreground">
                              {formattedKey}
                            </div>
                            <div className="font-medium">
                              {typeof value === 'boolean' ? (
                                <Badge variant={value ? "success" : "destructive"} className="font-normal">
                                  {value ? "Yes" : "No"}
                                </Badge>
                              ) : (
                                <span>{value.toString()}</span>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="links" className="mt-4 space-y-5">
                {/* External Links Tab */}
                <div className="bg-card rounded-lg border">
                  <div className="border-b p-4">
                    <h3 className="font-semibold">External Links Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      {detailedDataRef.current.externalLinks && detailedDataRef.current.externalLinks.length > 0 
                        ? `Found ${detailedDataRef.current.externalLinks.length} external links on this page`
                        : "No external links were found on this page"}
                    </p>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {detailedDataRef.current.externalLinks && detailedDataRef.current.externalLinks.length > 0 ? (
                      detailedDataRef.current.externalLinks.map((link, index) => (
                        <div 
                          key={index} 
                          className={`p-3 border rounded-md ${
                            link.is_safe === "Trustworthy" 
                              ? "border-green-200 bg-green-50/50 dark:bg-green-950/10" :
                            link.is_safe === "Untrustworthy" 
                              ? "border-red-200 bg-red-50/50 dark:bg-red-950/10" :
                              "border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1 truncate pr-4 flex-1">
                              <a 
                                href={link.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm font-medium hover:underline block truncate"
                              >
                                {link.link}
                              </a>
                              <p className="text-xs text-muted-foreground">{link.reason}</p>
                            </div>
                            <Badge 
                              className="whitespace-nowrap flex-shrink-0" 
                              variant={
                                link.is_safe === "Trustworthy" ? "outline" :
                                link.is_safe === "Untrustworthy" ? "destructive" : "secondary"
                              }
                            >
                              {link.is_safe}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-6 text-muted-foreground">
                        No external links were found on this page
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">No analysis data available</p>
            </div>
          )}
          
          <SheetFooter className="mt-6 border-t pt-4">
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>Close Report</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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
  );
}

function InfoCard({ icon, title, value, description }) {
  return (
    <div className="border rounded-md p-3 flex">
      <div className="mr-3 mt-0.5">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-base font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}
