import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  addDay,
  addMonth,
  deleteDay,
  deleteDays,
  deleteCycle,
  editCycleClass,
  editDay,
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

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const payload =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  try {
    switch (payload.action) {
      case "saveSettings": {
        if (!Array.isArray(payload.names)) {
          return NextResponse.json({ error: "names must be an array" }, { status: 400 });
        }
        await saveSettings(Number(payload.studentCount), payload.names);
        break;
      }
      case "addMonth": {
        await addMonth(typeof payload.monthValue === "string" ? payload.monthValue : undefined);
        break;
      }
      case "addDay": {
        await addDay(Number(payload.monthId), String(payload.dateIso ?? ""));
        break;
      }
      case "toggleClass": {
        await toggleClass(Number(payload.dayId), Number(payload.studentIndex));
        break;
      }
      case "togglePayment": {
        await togglePayment(Number(payload.cycleId), Boolean(payload.paymentGiven));
        break;
      }
      case "deleteDay": {
        await deleteDay(Number(payload.dayId));
        break;
      }
      case "deleteDays": {
        if (!Array.isArray(payload.dayIds)) {
          return NextResponse.json({ error: "dayIds must be an array" }, { status: 400 });
        }
        await deleteDays(payload.dayIds.map((id) => Number(id)));
        break;
      }
      case "deleteCycle": {
        await deleteCycle(Number(payload.cycleId));
        break;
      }
      case "editCycleClass": {
        await editCycleClass(
          Number(payload.classId),
          String(payload.dateIso ?? ""),
          String(payload.dayName ?? ""),
        );
        break;
      }
      case "editDay": {
        if (!Array.isArray(payload.topics)) {
          return NextResponse.json({ error: "topics must be an array" }, { status: 400 });
        }
        await editDay(
          Number(payload.dayId),
          String(payload.dateIso ?? ""),
          String(payload.dayName ?? ""),
          payload.topics.map((topic) => String(topic ?? "")),
        );
        break;
      }
      default:
        return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const monthId = typeof payload.monthId === "number" ? payload.monthId : Number(payload.monthId);
    const nextState = await getTrackerState(Number.isFinite(monthId) ? monthId : undefined);
    return NextResponse.json(nextState);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
