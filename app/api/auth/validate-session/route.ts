// app/api/auth/validate-session/route.ts
import { NextResponse } from "next/server";
import dotenv from "dotenv";
dotenv.config();
export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";

  const res = await fetch(`${process.env.API_URL}/validate-session`, {
    method: "GET",
    headers: { cookie },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}