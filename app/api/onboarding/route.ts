import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const flaskUrl = process.env.API_URL || 'http://localhost:5328';

/**
 * POST /api/onboarding - Update user's display name
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${flaskUrl}/api/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to update profile' }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('Error updating profile:', err);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
