import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  addDay,
  addMonth,
  getTrackerState,
  saveSettings,
  toggleClass,
  togglePayment,
} from "@/lib/repository";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthIdParam = searchParams.get("monthId");
  const monthId = monthIdParam ? Number(monthIdParam) : undefined;

  const state = await getTrackerState(monthId);
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  try {
    switch (body?.action) {
      case "saveSettings": {
        await saveSettings(Number(body.studentCount), Array.isArray(body.names) ? body.names : []);
        break;
      }
      case "addMonth": {
        await addMonth(typeof body.monthValue === "string" ? body.monthValue : undefined);
        break;
      }
      case "addDay": {
        await addDay(Number(body.monthId), String(body.dateIso ?? ""));
        break;
      }
      case "toggleClass": {
        await toggleClass(Number(body.dayId), Number(body.studentIndex));
        break;
      }
      case "togglePayment": {
        await togglePayment(Number(body.cycleId), Boolean(body.paymentGiven));
        break;
      }
      default:
        return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const nextState = await getTrackerState(Number(body.monthId) || undefined);
    return NextResponse.json(nextState);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
