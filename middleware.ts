import { NextResponse, type NextRequest } from "next/server"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase-config"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value
  
  let user = null
  
  console.log("Middleware checking token:", token ? "present" : "missing")
  
  if (token) {
    try {
      // Verify token with Supabase
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
        },
      })
      
      console.log("Token verification:", res.status)
      
      if (res.ok) {
        const data = await res.json()
        user = data
        console.log("User authenticated:", user.id)
      } else {
        console.log("Token invalid")
      }
    } catch (e) {
      console.error("Token verification failed:", e)
    }
  }

  // Auth routes - redirect to dashboard if already logged in
  if (user && request.nextUrl.pathname.startsWith("/auth/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Protected routes - redirect to login if not logged in
  const protectedRoutes = ["/dashboard", "/campaigns", "/settings", "/onboarding", "/admin"]
  const isProtected = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  
  if (!user && isProtected) {
    console.log("Redirecting to login - no user found for:", request.nextUrl.pathname)
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
