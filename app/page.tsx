"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Building2 } from "lucide-react"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If session exists, we are redirecting, so show loading state
  if (session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="p-3 bg-primary/10 rounded-full">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Hostel Management
          </h1>
          <p className="text-muted-foreground">
            Streamlined administration for modern hostels.
          </p>
        </div>

        <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold tracking-tight">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/auth/signin")}
              className="w-full h-11 text-base font-medium shadow-md transition-all hover:shadow-lg"
              size="lg"
            >
              Sign In to Portal
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/50 pt-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Hostel Management System.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
