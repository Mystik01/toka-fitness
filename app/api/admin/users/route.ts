import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/app/lib/apiClient';

export async function GET(req: NextRequest) {
  try {
    // Proxy to Flask backend to fetch users (no direct Supabase on frontend)
    const apiBase = getApiUrl();
    const res = await fetch(`${apiBase}/api/admin/users`, {
      headers: { cookie: req.headers.get('cookie') || '' },
      credentials: 'include',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch users' }, { status: 500 });
  }
}
