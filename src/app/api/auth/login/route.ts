import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie, validateCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = String(body?.username ?? "");
  const password = String(body?.password ?? "");

  if (!validateCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = await createSessionToken(username);
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
