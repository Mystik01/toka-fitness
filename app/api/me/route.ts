// app/api/me/route.ts
import { NextResponse } from "next/server";
import dotenv from "dotenv";
dotenv.config();
export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";

  const res = await fetch(`${process.env.API_URL}/me`, {
    method: "GET",
    headers: { cookie },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const cookie = req.headers.get("cookie") || "";

  const res = await fetch(`${process.env.API_URL}/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      cookie,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}