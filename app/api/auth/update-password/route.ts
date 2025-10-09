// app/api/auth/update-password/route.ts
import { NextResponse } from "next/server";
import dotenv from "dotenv";
dotenv.config();

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(`${process.env.API_URL}/update-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  
  const response = NextResponse.json(data, { status: res.status });

  // Forward cookies from Flask → Next.js → Browser
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    response.headers.set("set-cookie", setCookie);
  }

  return response;
}