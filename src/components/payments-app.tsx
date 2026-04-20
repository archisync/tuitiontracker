"use client";

import Link from "next/link";
import { useState } from "react";
import PaymentCyclesPanel from "@/components/payment-cycles-panel";
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

export default function PaymentsApp({ initialState, username }: Props) {
  const [state, setState] = useState<TrackerState>(initialState);
  const [error, setError] = useState<string>("");

  const setPaymentGiven = async (cycleId: number, paymentGiven: boolean): Promise<void> => {
    try {
      setError("");
      const nextState = await postAction({
        action: "togglePayment",
        cycleId,
        paymentGiven,
        monthId: state.selectedMonthId,
      });
      setState(nextState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  };

  const deleteCycle = async (cycleId: number): Promise<void> => {
    try {
      setError("");
      const nextState = await postAction({
        action: "deleteCycle",
        cycleId,
        monthId: state.selectedMonthId,
      });
      setState(nextState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  };

  const editCycleClass = async (classId: number, dateIso: string, dayName: string): Promise<void> => {
    try {
      setError("");
      const nextState = await postAction({
        action: "editCycleClass",
        classId,
        dateIso,
        dayName,
        monthId: state.selectedMonthId,
      });
      setState(nextState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#060d1d] text-slate-100">
      <div className="mx-auto max-w-5xl p-3 sm:p-6">
        <header className="mb-4 flex items-center justify-between rounded-2xl border border-sky-400/30 bg-[#0a1730] p-3 sm:p-4">
          <div>
            <h1 className="text-xl font-bold text-sky-300 sm:text-2xl">Payments</h1>
            <p className="text-xs text-slate-300 sm:text-sm">Welcome, {username}</p>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-400"
          >
            Back to Tracker
          </Link>
        </header>

        {error ? (
          <div className="mb-4 rounded-xl border border-rose-400/50 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>
        ) : null}

        <PaymentCyclesPanel
          cycles={state.cycles}
          onTogglePayment={setPaymentGiven}
          onDeleteCycle={deleteCycle}
          onEditCycleClass={editCycleClass}
        />
      </div>
    </div>
  );
}
