# Authentication Middleware

## Overview
The middleware protects routes by checking for authentication **before** pages render, preventing any flash of protected content.

## How It Works

### Protected Routes
Any route starting with `/dashboard` requires authentication:
- `/dashboard` - Main dashboard
- `/dashboard/account` - Account settings
- `/dashboard/workouts` - Workouts page
- `/dashboard/*` - Any dashboard sub-route

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  User tries to access /dashboard                        │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   Middleware Runs    │
         │  (before page loads) │
         └──────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
   Has Token?              No Token?
   ✅ Yes                  ❌ No
        │                       │
        ▼                       ▼
   Continue to          Redirect to
   /dashboard          /auth/login?redirect=/dashboard
        │                       │
        ▼                       ▼
   Page Renders         Login Page Shows
                              │
                              ▼
                        User Logs In
                              │
                              ▼
                    Redirected to /dashboard
                    (original destination)
```

## Features

### 1. **Route Protection**
```typescript
const isProtectedRoute = pathname.startsWith('/dashboard')

if (isProtectedRoute && !token) {
  // Redirect to login with return URL
  return NextResponse.redirect('/auth/login?redirect=/dashboard/account')
}
```

### 2. **Smart Redirects**
When redirected to login, the original URL is preserved:
```
User visits: /dashboard/account
   ↓
Middleware redirects to: /auth/login?redirect=/dashboard/account
   ↓
After login, user goes to: /dashboard/account (not just /dashboard)
```

### 3. **Prevent Logged-In Users from Seeing Auth Pages**
```typescript
const isAuthRoute = pathname.startsWith('/auth/login') || 
                    pathname.startsWith('/auth/register')

if (isAuthRoute && token) {
  // Already logged in? Go to dashboard
  return NextResponse.redirect('/dashboard')
}
```

### 4. **Performance - No Page Flash**
- ❌ **Without middleware**: Page loads → Layout renders → JS checks auth → Redirect (user sees protected page briefly)
- ✅ **With middleware**: Check auth → Redirect → Only then page loads (instant, no flash)

## Adding More Protected Routes

To protect additional routes, update the middleware:

```typescript
const isProtectedRoute = 
  pathname.startsWith('/dashboard') ||
  pathname.startsWith('/profile') ||
  pathname.startsWith('/settings') ||
  pathname.startsWith('/admin');
```

## Excluding Routes from Middleware

The `matcher` config excludes:
- `/api/*` - API routes (don't need middleware)
- `/_next/*` - Next.js internal files
- `/favicon.ico` - Static files
- `/public/*` - Public assets

```typescript
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
```

## Token Validation

The middleware only checks if a token **exists**, not if it's **valid**. For full validation:

1. **Client-side**: Use `validateSession()` in page components for detailed checks
2. **Server-side**: API calls will validate the token with Supabase

This is intentional for performance - middleware is fast and runs on every request.

## Testing

### Test Protected Route
1. Visit `/dashboard` without logging in
2. Should redirect to `/auth/login?redirect=/dashboard`
3. Login
4. Should redirect back to `/dashboard`

### Test Auth Page Redirect
1. Login to your account
2. Try to visit `/auth/login`
3. Should redirect to `/dashboard` (already logged in)

### Test Public Routes
1. Visit `/` (home page)
2. Should load normally (no redirect)

## Troubleshooting

### Issue: Infinite redirect loop
**Cause**: Middleware redirecting to a protected route  
**Solution**: Ensure login page is NOT in protected routes list

### Issue: Still seeing protected pages briefly
**Cause**: Middleware not running or matcher config wrong  
**Solution**: Check `middleware.ts` is in root directory and matcher includes your route

### Issue: Can't access any pages
**Cause**: Matcher too broad  
**Solution**: Verify matcher excludes `_next`, `api`, and static files

## Files Involved

- **`/middleware.ts`** - Main middleware logic
- **`/app/auth/login/page.tsx`** - Updated to handle redirect parameter
- **`/app/lib/auth.ts`** - Auth helper functions
- **Cookie**: `sb-access-token` - Stores session token

## Security Notes

✅ **Middleware runs on Edge runtime** - Fast and global  
✅ **Checks happen server-side** - Can't be bypassed by disabling JavaScript  
✅ **HTTP-only cookies** - Token not accessible via JavaScript  
✅ **No token validation in middleware** - Keeps it fast; full validation in API  

## Future Enhancements

Consider adding:
- Role-based access control (admin, user, etc.)
- Rate limiting for login attempts
- Token refresh logic in middleware
- Redirect to maintenance page during deployments
