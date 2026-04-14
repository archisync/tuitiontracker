import { ensureSchema, execute, triggerBackgroundSync } from "@/lib/db";
import { getDhakaDayName, getDhakaMonthLabel, getDhakaNowParts } from "@/lib/time";
import type { Cycle, TrackerState } from "@/lib/types";

function sanitizeName(name: string, fallback: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 60) : fallback;
}

async function ensureCurrentMonthId() {
  const { year, month } = getDhakaNowParts();
  const label = getDhakaMonthLabel(year, month);

  await execute({
    sql: "INSERT OR IGNORE INTO months (year, month, label) VALUES (?, ?, ?)",
    args: [year, month, label],
  });

  const monthResult = await execute({
    sql: "SELECT id FROM months WHERE year = ? AND month = ?",
    args: [year, month],
  });

  return Number(monthResult.rows[0].id);
}

async function getCycles(): Promise<Cycle[]> {
  const cyclesResult = await execute(
    "SELECT id, student_index, student_name, start_date, end_date, payment_given FROM cycles ORDER BY id DESC",
  );

  const classesResult = await execute(
    "SELECT id, cycle_id, class_number, date_iso, day_name, student_name FROM cycle_classes ORDER BY cycle_id DESC, class_number ASC",
  );

  const classesByCycle = new Map<number, Cycle["classes"]>();

  for (const row of classesResult.rows) {
    const cycleId = Number(row.cycle_id);
    if (!classesByCycle.has(cycleId)) {
      classesByCycle.set(cycleId, []);
    }

    classesByCycle.get(cycleId)?.push({
      id: Number(row.id),
      classNumber: Number(row.class_number),
      dateIso: String(row.date_iso),
      dayName: String(row.day_name),
      studentName: String(row.student_name),
    });
  }

  return cyclesResult.rows.map((row) => {
    const cycleId = Number(row.id);
    return {
      id: cycleId,
      studentIndex: Number(row.student_index),
      studentName: String(row.student_name),
      startDate: String(row.start_date),
      endDate: String(row.end_date),
      paymentGiven: Number(row.payment_given) === 1,
      classes: classesByCycle.get(cycleId) ?? [],
    };
  });
}

async function archiveIfNeeded(studentIndex: number) {
  const pendingRows = await execute({
    sql: `SELECT id, date_iso, day_name, student_name
          FROM class_events
          WHERE student_index = ? AND archived_cycle_id IS NULL
          ORDER BY date_iso ASC, id ASC
          LIMIT 12`,
    args: [studentIndex],
  });

  if (pendingRows.rows.length < 12) {
    return;
  }

  const classes = pendingRows.rows;
  const first = classes[0];
  const last = classes[11];

  const cycleInsert = await execute({
    sql: `INSERT INTO cycles (student_index, student_name, start_date, end_date, payment_given)
          VALUES (?, ?, ?, ?, 0)
          RETURNING id`,
    args: [studentIndex, String(first.student_name), String(first.date_iso), String(last.date_iso)],
  });

  const cycleId = Number(cycleInsert.rows[0].id);

  for (let index = 0; index < classes.length; index += 1) {
    const item = classes[index];
    await execute({
      sql: `INSERT INTO cycle_classes (cycle_id, class_number, date_iso, day_name, student_name)
            VALUES (?, ?, ?, ?, ?)`,
      args: [cycleId, index + 1, String(item.date_iso), String(item.day_name), String(item.student_name)],
    });
  }

  const ids = classes.map((row) => Number(row.id));
  const placeholders = ids.map(() => "?").join(",");

  await execute({
    sql: `UPDATE class_events SET archived_cycle_id = ? WHERE id IN (${placeholders})`,
    args: [cycleId, ...ids],
  });
}

export async function getTrackerState(monthId?: number): Promise<TrackerState> {
  await ensureSchema();

  const currentMonthId = await ensureCurrentMonthId();

  const settingsResult = await execute(
    "SELECT student_count, student1, student2, student3 FROM settings WHERE id = 1",
  );
  const settingsRow = settingsResult.rows[0];

  const studentCount = Number(settingsRow.student_count);
  const names = [
    String(settingsRow.student1),
    String(settingsRow.student2),
    String(settingsRow.student3),
  ].slice(0, studentCount);

  const monthsResult = await execute(
    "SELECT id, year, month, label FROM months ORDER BY year DESC, month DESC",
  );

  const months = monthsResult.rows.map((row) => ({
    id: Number(row.id),
    year: Number(row.year),
    month: Number(row.month),
    label: String(row.label),
  }));

  const selectedMonthId = months.some((item) => item.id === monthId)
    ? Number(monthId)
    : months[0]?.id ?? currentMonthId;

  const daysResult = await execute({
    sql: "SELECT id, date_iso, day_name FROM days WHERE month_id = ? ORDER BY date_iso ASC",
    args: [selectedMonthId],
  });

  const days = daysResult.rows.map((row) => ({
    id: Number(row.id),
    dateIso: String(row.date_iso),
    dayName: String(row.day_name),
  }));

  const eventsResult = days.length
    ? await execute({
        sql: `SELECT day_id, student_index
              FROM class_events
              WHERE archived_cycle_id IS NULL AND day_id IN (${days.map(() => "?").join(",")})`,
        args: days.map((day) => day.id),
      })
    : { rows: [] as Array<{ day_id: number; student_index: number }> };

  const checkedByDay: Record<string, number[]> = {};

  for (const row of eventsResult.rows) {
    const dayId = String(row.day_id);
    if (!checkedByDay[dayId]) {
      checkedByDay[dayId] = [];
    }
    checkedByDay[dayId].push(Number(row.student_index));
  }

  const cycles = await getCycles();

  return {
    settings: {
      studentCount,
      names,
    },
    months,
    selectedMonthId,
    days,
    checkedByDay,
    cycles,
  };
}

export async function saveSettings(studentCount: number, names: string[]) {
  await ensureSchema();

  const safeCount = Math.max(1, Math.min(3, Math.trunc(studentCount)));
  const safeNames = [0, 1, 2].map((index) =>
    sanitizeName(names[index] ?? "", `Student ${index + 1}`),
  );

  await execute({
    sql: `UPDATE settings
          SET student_count = ?, student1 = ?, student2 = ?, student3 = ?
          WHERE id = 1`,
    args: [safeCount, safeNames[0], safeNames[1], safeNames[2]],
  });

  triggerBackgroundSync();
}

export async function addMonth(monthValue?: string) {
  await ensureSchema();

  let year: number;
  let month: number;

  if (monthValue && /^\d{4}-\d{2}$/.test(monthValue)) {
    const [y, m] = monthValue.split("-");
    year = Number(y);
    month = Number(m);
  } else {
    const parts = getDhakaNowParts();
    year = parts.year;
    month = parts.month;
  }

  if (month < 1 || month > 12) {
    throw new Error("Invalid month.");
  }

  const label = getDhakaMonthLabel(year, month);

  await execute({
    sql: "INSERT OR IGNORE INTO months (year, month, label) VALUES (?, ?, ?)",
    args: [year, month, label],
  });

  triggerBackgroundSync();
}

export async function addDay(monthId: number, dateIso: string) {
  await ensureSchema();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    throw new Error("Invalid date format.");
  }

  const dayName = getDhakaDayName(dateIso);

  await execute({
    sql: "INSERT OR IGNORE INTO days (month_id, date_iso, day_name) VALUES (?, ?, ?)",
    args: [monthId, dateIso, dayName],
  });

  triggerBackgroundSync();
}

export async function toggleClass(dayId: number, studentIndex: number) {
  await ensureSchema();

  const safeStudentIndex = Math.max(0, Math.min(2, Math.trunc(studentIndex)));

  const existing = await execute({
    sql: `SELECT id
          FROM class_events
          WHERE day_id = ? AND student_index = ? AND archived_cycle_id IS NULL`,
    args: [dayId, safeStudentIndex],
  });

  if (existing.rows.length > 0) {
    await execute({
      sql: "DELETE FROM class_events WHERE id = ?",
      args: [Number(existing.rows[0].id)],
    });
    triggerBackgroundSync();
    return;
  }

  const dayRowResult = await execute({
    sql: "SELECT date_iso, day_name FROM days WHERE id = ?",
    args: [dayId],
  });

  if (!dayRowResult.rows[0]) {
    throw new Error("Day not found.");
  }

  const settingsResult = await execute(
    "SELECT student_count, student1, student2, student3 FROM settings WHERE id = 1",
  );
  const settings = settingsResult.rows[0];

  if (safeStudentIndex >= Number(settings.student_count)) {
    throw new Error("Invalid student index.");
  }

  const studentName = [String(settings.student1), String(settings.student2), String(settings.student3)][
    safeStudentIndex
  ];

  await execute({
    sql: `INSERT INTO class_events (day_id, student_index, student_name, date_iso, day_name)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      dayId,
      safeStudentIndex,
      studentName,
      String(dayRowResult.rows[0].date_iso),
      String(dayRowResult.rows[0].day_name),
    ],
  });

  await archiveIfNeeded(safeStudentIndex);
  triggerBackgroundSync();
}

export async function togglePayment(cycleId: number, paymentGiven: boolean) {
  await ensureSchema();

  await execute({
    sql: "UPDATE cycles SET payment_given = ? WHERE id = ?",
    args: [paymentGiven ? 1 : 0, cycleId],
  });

  triggerBackgroundSync();
}
