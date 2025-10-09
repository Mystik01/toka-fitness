// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import dotenv from "dotenv";
dotenv.config();
export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(`${process.env.API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}