import { NextResponse } from "next/server";
import { createSessionToken, setSessionCookie, validateCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const username = String(payload.username ?? "");
  const password = String(payload.password ?? "");

  if (!validateCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = await createSessionToken(username);
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
