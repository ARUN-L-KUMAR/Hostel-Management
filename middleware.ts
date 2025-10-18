import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// Define route permissions mapping
const routePermissions: { [key: string]: string } = {
  "/dashboard": "dashboard",
  "/dashboard/attendance": "attendance",
  "/dashboard/students": "students",
  "/dashboard/mando-students": "mando-students",
  "/dashboard/outsiders": "outsiders",
  "/dashboard/provisions": "provisions",
  "/dashboard/billing": "billing",
  "/dashboard/expenses": "expenses",
  "/dashboard/reports": "reports",
  "/dashboard/admin": "admin",
}

// Helper function to get required permission for a route
function getRequiredPermission(pathname: string): string | null {
  // Exact match first
  if (routePermissions[pathname]) {
    return routePermissions[pathname]
  }

  // Check for patterns (e.g., /dashboard/students/123)
  for (const route in routePermissions) {
    if (pathname.startsWith(route + "/")) {
      return routePermissions[route]
    }
  }

  // Default to dashboard permission for any /dashboard/* route
  if (pathname.startsWith("/dashboard/")) {
    return "dashboard"
  }

  return null
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const userRole = token?.role as string
    const userPermissions = token?.permissions as string[] || []

    console.log("[MIDDLEWARE] Checking access for:", {
      path: req.nextUrl.pathname,
      role: userRole,
      permissions: userPermissions
    })

    // Admin users have access to everything
    if (userRole === "ADMIN") {
      console.log("[MIDDLEWARE] ADMIN user - access granted")
      return NextResponse.next()
    }

    // Get required permission for this route
    const requiredPermission = getRequiredPermission(req.nextUrl.pathname)

    if (requiredPermission) {
      // Dashboard is always accessible
      if (requiredPermission === "dashboard") {
        console.log("[MIDDLEWARE] Dashboard access - granted")
        return NextResponse.next()
      }

      // Check if user has the required permission
      if (userPermissions && userPermissions.includes(requiredPermission)) {
        console.log(`[MIDDLEWARE] ${requiredPermission} access - granted`)
        return NextResponse.next()
      } else {
        console.log(`[MIDDLEWARE] ${requiredPermission} access - denied (permissions: ${userPermissions?.join(', ') || 'none'}), redirecting to dashboard`)

        // Add a query parameter to indicate access was denied
        const dashboardUrl = new URL("/dashboard", req.url)
        dashboardUrl.searchParams.set("access_denied", requiredPermission)

        return NextResponse.redirect(dashboardUrl)
      }
    }

    // No specific permission required for this route
    console.log("[MIDDLEWARE] No permission required for this route")
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Basic auth check - user must be logged in
        const isLoggedIn = !!token
        console.log("[MIDDLEWARE] Auth check:", isLoggedIn ? "authenticated" : "not authenticated")
        return isLoggedIn
      },
    },
  }
)

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/dashboard/admin",
    "/dashboard/attendance",
    "/dashboard/students/:path*",
    "/dashboard/billing",
    "/dashboard/expenses",
    "/dashboard/provisions",
    "/dashboard/reports",
    "/dashboard/mando-students",
    "/dashboard/outsiders"
  ]
}