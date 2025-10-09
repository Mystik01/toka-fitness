import { NextResponse } from 'next/server';
import dotenv from 'dotenv';
dotenv.config();

export async function POST(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  
  const res = await fetch(`${process.env.API_URL}/logout`, {
    method: 'POST',
    headers: { cookie },
    credentials: 'include',
  });

  const data = await res.json();
  
  const response = NextResponse.json(data, { status: res.status });
  
  // Clear the cookie
  response.cookies.set('sb-access-token', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 0, // Expires immediately
  });
  
  return response;
}
