# API Architecture Changes

## Summary
Refactored the application to eliminate duplicate API routes and ensure seamless operation in both development and production environments.

## What Changed

### ✅ Removed Duplicate API Routes
- **Deleted**: `app/api/auth/*` (login, register, logout, validate-session, forgot-password, update-password)
- **Deleted**: `app/api/me/*`
- **Reason**: These were Next.js API routes that simply proxied requests to Flask. Now the frontend calls Flask directly.

### ✅ Updated Frontend API Calls
**Files Modified:**
- `app/lib/auth.ts` - All auth functions now use environment-aware URLs
- `app/lib/apiClient.ts` - Updated to detect environment automatically

**How it works:**
```typescript
// Automatically detects environment
function getApiUrl(): string {
  // Production/Vercel: Use relative URLs (Flask is at /api/*)
  if (production) return '';
  
  // Development: Use localhost Flask server
  return 'http://localhost:5328';
}
```

### ✅ Cleaned Up Flask Backend
- **Deleted**: `api/connect.py` (no longer needed)
- **Updated**: `api/index.py` - Supabase client initialized inline

## Environment Variables

### Development (`.env.local`)
```bash
# Flask Backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
FLASK_PORT=5328

# Next.js Frontend
NEXT_PUBLIC_API_URL=http://localhost:5328
API_URL=http://localhost:5328
```

### Production (Vercel Dashboard)
Set these in **Settings → Environment Variables**:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon/public key

**Note:** `API_URL` is NOT needed in production - the app uses relative URLs automatically.

## How It Works Now

### Development (Local)
```
Browser → Next.js (localhost:3001) → Flask API (localhost:5328) → Supabase
```
- Next.js runs on port 3001
- Flask runs on port 5328
- Frontend makes cross-origin requests to Flask

### Production (Vercel)
```
Browser → Vercel (your-app.vercel.app) → Flask Serverless Function (/api/*) → Supabase
```
- Both Next.js and Flask are deployed together
- Flask routes are accessible at `/api/*`
- Frontend uses relative URLs (no port conflicts)

## API Endpoints

All endpoints are handled by Flask (`api/index.py`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/python` | GET | Test endpoint |
| `/api/login` | POST | User login |
| `/api/register` | POST | User registration |
| `/api/validate-session` | GET | Check if user is logged in |
| `/api/me` | GET | Get current user data |
| `/api/logout` | POST | User logout |
| `/api/reset-password` | POST | Send password reset email |
| `/api/update-password` | POST | Update password with reset token |

## Running the App

### Development
```bash
# Install dependencies
pnpm install
pip3 install -r requirements.txt

# Create .env.local with your Supabase credentials
cp .env.example .env.local

# Run both Next.js and Flask
pnpm run dev
```

### Production (Vercel)
1. Set environment variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
2. Deploy: `vercel --prod` or push to GitHub (if connected)

## Benefits

✅ **Simpler architecture** - No double-hop through Next.js API routes  
✅ **Works everywhere** - Automatic environment detection  
✅ **Better performance** - Direct Flask calls reduce latency  
✅ **Easier debugging** - One place to check for API issues  
✅ **Less code** - Removed ~200 lines of duplicate proxy code  

## Troubleshooting

### Local Development Issues

**Problem**: `fetch failed ECONNREFUSED localhost:5328`  
**Solution**: Make sure Flask is running with `pnpm run dev`

**Problem**: CORS errors in browser console  
**Solution**: Flask CORS is configured for `localhost:3001`. Check `api/index.py` if using different port.

### Production Issues

**Problem**: `supabase_url is required`  
**Solution**: Set `SUPABASE_URL` and `SUPABASE_KEY` in Vercel environment variables

**Problem**: 404 on `/api/*` endpoints  
**Solution**: Ensure `api/index.py` exists and Vercel recognizes it as a serverless function

### Still Having Issues?

Check that:
1. ✅ `.env.local` has correct Supabase credentials (development)
2. ✅ Vercel has environment variables set (production)
3. ✅ Flask is running on port 5328 (development)
4. ✅ No `app/api/auth` or `app/api/me` folders exist (should be deleted)
