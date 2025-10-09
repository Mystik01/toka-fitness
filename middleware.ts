import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  
  // Get the session token from cookies
  const token = request.cookies.get('sb-access-token')?.value
  
  // Define protected routes (routes that require authentication)
  const isProtectedRoute = pathname.startsWith('/dashboard')
  
  // Define auth routes (login, register, etc.)
  const isAuthRoute = pathname.startsWith('/auth/login') || 
                      pathname.startsWith('/auth/register') ||
                      pathname.startsWith('/auth/forgot') ||
                      pathname.startsWith('/auth/reset-password')
  
  // If accessing a protected route without a token, redirect to login
  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    // Add redirect parameter so user can be sent back after login
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  
  // If accessing auth routes with a valid token, redirect to dashboard or original destination
  if (isAuthRoute && token) {
    const url = request.nextUrl.clone()
    
    // Check if there's a redirect parameter (user was sent here from protected route)
    const redirectTo = searchParams.get('redirect')
    
    if (redirectTo && redirectTo.startsWith('/')) {
      // Redirect back to where they wanted to go
      url.pathname = redirectTo
      url.search = '' // Clear search params
    } else {
      // No redirect param, just go to dashboard
      url.pathname = '/dashboard'
    }
    
    return NextResponse.redirect(url)
  }
  
  // For all other cases, continue normally
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
