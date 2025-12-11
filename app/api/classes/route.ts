import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const flaskUrl = process.env.API_URL || 'http://localhost:5328';

/**
 * GET /api/classes - Fetch all classes from Flask backend
 */
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${flaskUrl}/api/classes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to fetch classes' }, { status: response.status });
    }

    return NextResponse.json({ classes: data.classes || [] }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching classes:', err);
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/classes - Create a new class (staff only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${flaskUrl}/api/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to create class' }, { status: response.status });
    }

    return NextResponse.json({ class: data.class }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating class:', err);
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/classes - Update a class (staff only)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${flaskUrl}/api/classes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to update class' }, { status: response.status });
    }

    return NextResponse.json({ class: data.class }, { status: 200 });
  } catch (err: any) {
    console.error('Error updating class:', err);
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/classes - Delete a class (staff only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${flaskUrl}/api/classes/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to delete class' }, { status: response.status });
    }

    return NextResponse.json({ message: 'Class deleted successfully' }, { status: 200 });
  } catch (err: any) {
    console.error('Error deleting class:', err);
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}
