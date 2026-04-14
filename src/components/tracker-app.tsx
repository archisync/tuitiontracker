"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { defaultStudentName } from "@/lib/constants";
import type { TrackerState } from "@/lib/types";

type Props = {
  initialState: TrackerState;
  username: string;
};


async function postAction(payload: Record<string, unknown>) {
  const response = await fetch("/api/tracker", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error ?? "Something went wrong");
  }

  return json as TrackerState;
}

export default function TrackerApp({ initialState, username }: Props) {
  const [state, setState] = useState<TrackerState>(initialState);
  const [error, setError] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [showAddMonth, setShowAddMonth] = useState(false);
  const [showAddDay, setShowAddDay] = useState(false);
  const [newMonth, setNewMonth] = useState("");
  const [newDay, setNewDay] = useState("");
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [studentCountDraft, setStudentCountDraft] = useState(state.settings.studentCount);
  const [namesDraft, setNamesDraft] = useState<string[]>(
    Array.from({ length: 3 }, (_, index) => state.settings.names[index] ?? defaultStudentName(index)),
  );

  useEffect(() => {
    if (!showSettings) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSettings(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showSettings]);

  const refresh = async (monthId?: number) => {
    const response = await fetch(`/api/tracker${monthId ? `?monthId=${monthId}` : ""}`);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error ?? "Failed to refresh state");
    }

    setState(json as TrackerState);
    setStudentCountDraft((json as TrackerState).settings.studentCount);
    setNamesDraft(
      Array.from(
        { length: 3 },
        (_, index) => (json as TrackerState).settings.names[index] ?? defaultStudentName(index),
      ),
    );
  };

  const handleMonthChange = async (value: string) => {
    const monthId = Number(value);
    try {
      await refresh(monthId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load month");
    }
  };

  const callAction = async (payload: Record<string, unknown>): Promise<TrackerState | null> => {
    try {
      setError("");
      const nextState = await postAction(payload);
      setState(nextState);
      setStudentCountDraft(nextState.settings.studentCount);
      setNamesDraft(
        Array.from({ length: 3 }, (_, index) => nextState.settings.names[index] ?? defaultStudentName(index)),
      );
      return nextState;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      return null;
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#060d1d] text-slate-100">
      <div className="mx-auto max-w-7xl p-3 sm:p-6">
        <header className="mb-4 flex items-center justify-between rounded-2xl border border-sky-400/30 bg-[#0a1730] p-3 sm:p-4">
          <div>
            <h1 className="text-xl font-bold text-sky-300 sm:text-2xl">Tuition Tracker</h1>
            <p className="text-xs text-slate-300 sm:text-sm">Welcome, {username}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings((value) => !value)}
              className="rounded-full border border-sky-300/40 bg-[#10244a] px-3 py-2 text-sm hover:bg-[#153160]"
              aria-label="Open settings"
            >
              ⚙️
            </button>
            <Link
              href="/payments"
              className="rounded-full border border-sky-300/40 bg-[#10244a] px-3 py-2 text-sm hover:bg-[#153160]"
              aria-label="Open payments"
            >
              💰
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400"
            >
              Logout
            </button>
          </div>
        </header>

        {showSettings && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowSettings(false)}
          >
            <section
              className="relative w-full max-w-2xl rounded-2xl border border-sky-400/30 bg-[#0b1b38] p-4"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-sky-200">Settings</h2>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="rounded-lg border border-sky-400/30 bg-[#091226] px-2 py-1 text-sm"
                  aria-label="Close settings"
                >
                  ✕
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  Number of Students (max 3)
                  <select
                    className="mt-1 w-full rounded-lg border border-sky-400/30 bg-[#091226] p-2"
                    value={studentCountDraft}
                    onChange={(event) => setStudentCountDraft(Number(event.target.value))}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </label>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {Array.from({ length: studentCountDraft }, (_, index) => (
                  <label key={index} className="text-sm">
                    Name of Student {index + 1}
                    <input
                      className="mt-1 w-full rounded-lg border border-sky-400/30 bg-[#091226] p-2"
                      value={namesDraft[index] ?? ""}
                      onChange={(event) => {
                        const next = [...namesDraft];
                        next[index] = event.target.value;
                        setNamesDraft(next);
                      }}
                    />
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={async () => {
                  setIsSettingsSaving(true);
                  const nextState = await callAction({
                    action: "saveSettings",
                    studentCount: studentCountDraft,
                    names: namesDraft,
                  });
                  setIsSettingsSaving(false);
                  if (nextState) {
                    setShowSettings(false);
                  }
                }}
                disabled={isSettingsSaving}
                className="mt-4 rounded-xl bg-sky-500 px-4 py-2 font-semibold text-slate-900 hover:bg-sky-400"
              >
                {isSettingsSaving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="mt-2 rounded-xl border border-sky-400/30 px-4 py-2 font-semibold text-slate-200 hover:bg-[#091226]"
              >
                Cancel
              </button>
            </section>
          </div>
        )}

        {error ? (
          <div className="mb-4 rounded-xl border border-rose-400/50 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>
        ) : null}

        <main className="rounded-2xl border border-sky-400/30 bg-[#0b1b38] p-4">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-sky-400/30 bg-[#091226] p-2 text-sm"
                value={state.selectedMonthId}
                onChange={(event) => handleMonthChange(event.target.value)}
              >
                {state.months.map((month) => (
                  <option key={month.id} value={month.id}>
                    {month.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowAddMonth((value) => !value)}
                className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400"
              >
                Add Month
              </button>

              <button
                type="button"
                onClick={() => setShowAddDay((value) => !value)}
                className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400"
              >
                Add Day
              </button>
            </div>

            {showAddMonth && (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-sky-400/20 bg-[#091226] p-3">
                <input
                  type="month"
                  className="rounded-lg border border-sky-400/30 bg-[#060d1d] p-2 text-sm"
                  value={newMonth}
                  onChange={(event) => setNewMonth(event.target.value)}
                />
                <button
                  type="button"
                  onClick={async () => {
                    await callAction({
                      action: "addMonth",
                      monthValue: newMonth || undefined,
                      monthId: state.selectedMonthId,
                    });
                    setNewMonth("");
                    setShowAddMonth(false);
                  }}
                  className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900"
                >
                  Save Month
                </button>
              </div>
            )}

            {showAddDay && (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-sky-400/20 bg-[#091226] p-3">
                <input
                  type="date"
                  className="rounded-lg border border-sky-400/30 bg-[#060d1d] p-2 text-sm"
                  value={newDay}
                  onChange={(event) => setNewDay(event.target.value)}
                />
                <button
                  type="button"
                  onClick={async () => {
                    await callAction({
                      action: "addDay",
                      monthId: state.selectedMonthId,
                      dateIso: newDay,
                    });
                    setNewDay("");
                    setShowAddDay(false);
                  }}
                  className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900"
                >
                  Save Day
                </button>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-sky-400/20">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#10244a] text-sky-100">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Day</th>
                    {state.settings.names.map((name, studentIndex) => (
                      <th key={studentIndex} className="px-3 py-2">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {state.days.length === 0 ? (
                    <tr>
                      <td colSpan={2 + state.settings.studentCount} className="px-3 py-6 text-center text-slate-300">
                        Add a day to start tracking classes.
                      </td>
                    </tr>
                  ) : (
                    state.days.map((day) => (
                      <tr key={day.id} className="border-t border-sky-400/10">
                        <td className="px-3 py-2">{day.dateIso}</td>
                        <td className="px-3 py-2">{day.dayName}</td>
                        {state.settings.names.map((name, studentIndex) => {
                          const checked = (state.checkedByDay[String(day.id)] ?? []).includes(studentIndex);
                          return (
                            <td key={`${name}-${day.id}`} className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() =>
                                  callAction({
                                    action: "toggleClass",
                                    dayId: day.id,
                                    studentIndex,
                                    monthId: state.selectedMonthId,
                                  })
                                }
                                className={`h-7 w-7 rounded-full border-2 transition ${
                                  checked
                                    ? "border-emerald-300 bg-emerald-500"
                                    : "border-sky-300/60 bg-transparent hover:border-sky-200"
                                }`}
                                aria-label={`Toggle ${name} on ${day.dateIso}`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
        </main>
      </div>
    </div>
  );
}
