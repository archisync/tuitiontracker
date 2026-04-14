"use client";

import { useState } from "react";
import type { Cycle } from "@/lib/types";

type Props = {
  cycles: Cycle[];
  onTogglePayment: (cycleId: number, paymentGiven: boolean) => Promise<void>;
};

export default function PaymentCyclesPanel({ cycles, onTogglePayment }: Props) {
  const [expandedCycleId, setExpandedCycleId] = useState<number | null>(null);

  return (
    <section className="rounded-2xl border border-sky-400/30 bg-[#0b1b38] p-4">
      <h2 className="mb-3 text-lg font-semibold text-sky-200">Calculation / Payment</h2>
      <div className="space-y-3">
        {cycles.length === 0 ? (
          <p className="text-sm text-slate-300">No completed 12-class cycles yet.</p>
        ) : (
          cycles.map((cycle) => (
            <div key={cycle.id} className="rounded-xl border border-sky-400/20 bg-[#091226] p-3">
              <button
                type="button"
                onClick={() => setExpandedCycleId((current) => (current === cycle.id ? null : cycle.id))}
                className="flex w-full flex-col items-start gap-1 text-left"
              >
                <span className="font-semibold text-sky-200">{cycle.studentName}</span>
                <span className="text-xs text-slate-300">
                  {cycle.startDate} → {cycle.endDate}
                </span>
                <span className="text-xs text-slate-300">Classes Taken: 12/12</span>
              </button>

              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={cycle.paymentGiven}
                  onChange={(event) => {
                    void onTogglePayment(cycle.id, event.target.checked);
                  }}
                />
                Payment Given
              </label>

              {expandedCycleId === cycle.id && (
                <ul className="mt-3 space-y-1 text-xs text-slate-200">
                  {cycle.classes.map((item) => (
                    <li key={item.id} className="rounded bg-[#071023] p-2">
                      #{item.classNumber} • {item.dateIso} • {item.dayName} • {item.studentName}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
