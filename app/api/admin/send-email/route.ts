import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/app/lib/apiClient';

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html } = await req.json();

    if (!Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: 'Missing recipients' }, { status: 400 });
    }
    if (!subject || !html) {
      return NextResponse.json({ error: 'Missing subject or content' }, { status: 400 });
    }

    // Authorize via Flask /api/me (uses session cookie)
    const meRes = await fetch(`${getApiUrl()}/api/me`, {
      headers: { cookie: req.headers.get('cookie') || '' },
      credentials: 'include',
    });
    if (!meRes.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const me = await meRes.json();
    const role = me.role || me.user_metadata?.role;
    if (!['staff', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || 'no-reply@yourdomain.com';
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing RESEND_API_KEY' }, { status: 500 });
    }

    // Use Resend REST API directly
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ id: data.id }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to send email' }, { status: 500 });
  }
}
