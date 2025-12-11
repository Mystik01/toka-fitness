import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const flaskUrl = process.env.API_URL || 'http://localhost:5328';

/**
 * GET /api/staff-users - Fetch all staff users from Flask backend
 */
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${flaskUrl}/api/staff-users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to fetch staff users' }, { status: response.status });
    }

    return NextResponse.json({ staff_users: data.staff_users || [] }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching staff users:', err);
    return NextResponse.json(
      { error: 'Failed to fetch staff users' },
      { status: 500 }
    );
  }
}
