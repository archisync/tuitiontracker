"use client";

import { useState } from "react";
import type { Cycle, CycleClass } from "@/lib/types";

type EditCycleClassDraft = {
  classId: number;
  classNumber: number;
  dateIso: string;
  dayName: string;
};

type EditCycleDraft = {
  cycleId: number;
  studentName: string;
  classes: EditCycleClassDraft[];
};

type Props = {
  cycles: Cycle[];
  onTogglePayment: (cycleId: number, paymentGiven: boolean) => Promise<void>;
  onDeleteCycle: (cycleId: number) => Promise<void>;
  onEditCycleClass: (classId: number, dateIso: string, dayName: string) => Promise<void>;
};

export default function PaymentCyclesPanel({ cycles, onTogglePayment, onDeleteCycle, onEditCycleClass }: Props) {
  const [expandedCycleId, setExpandedCycleId] = useState<number | null>(null);
  const [editCycleDraft, setEditCycleDraft] = useState<EditCycleDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openEditCycle = (cycle: Cycle) => {
    setEditCycleDraft({
      cycleId: cycle.id,
      studentName: cycle.studentName,
      classes: cycle.classes.map((item: CycleClass) => ({
        classId: item.id,
        classNumber: item.classNumber,
        dateIso: item.dateIso,
        dayName: item.dayName,
      })),
    });
  };

  const handleSaveEdit = async () => {
    if (!editCycleDraft) return;
    setIsSaving(true);
    try {
      await Promise.all(
        editCycleDraft.classes.map((item) => onEditCycleClass(item.classId, item.dateIso, item.dayName)),
      );
      setEditCycleDraft(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-sky-400/30 bg-[#0b1b38] p-4">
      <h2 className="mb-3 text-lg font-semibold text-sky-200">Calculation / Payment</h2>

      {editCycleDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEditCycleDraft(null)}
        >
          <section
            className="relative w-full max-w-2xl rounded-2xl border border-sky-400/30 bg-[#0b1b38] p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-sky-200">
                Edit Classes – {editCycleDraft.studentName}
              </h2>
              <button
                type="button"
                onClick={() => setEditCycleDraft(null)}
                className="rounded-lg border border-sky-400/30 bg-[#091226] px-2 py-1 text-sm"
                aria-label="Close edit cycle modal"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {editCycleDraft.classes.map((item, index) => (
                <div key={item.classId} className="grid grid-cols-2 gap-2 rounded-lg bg-[#071023] p-2">
                  <label className="text-xs text-slate-300">
                    Class #{item.classNumber} – Date
                    <input
                      type="date"
                      className="mt-1 w-full rounded border border-sky-400/30 bg-[#091226] p-1 text-sm text-slate-100"
                      value={item.dateIso}
                      onChange={(event) => {
                        const newDate = event.target.value;
                        setEditCycleDraft((current) => {
                          if (!current) return current;
                          const nextClasses = [...current.classes];
                          nextClasses[index] = { ...nextClasses[index], dateIso: newDate };
                          return { ...current, classes: nextClasses };
                        });
                      }}
                    />
                  </label>
                  <label className="text-xs text-slate-300">
                    Day
                    <input
                      type="text"
                      className="mt-1 w-full rounded border border-sky-400/30 bg-[#091226] p-1 text-sm text-slate-100"
                      value={item.dayName}
                      onChange={(event) => {
                        const newDay = event.target.value;
                        setEditCycleDraft((current) => {
                          if (!current) return current;
                          const nextClasses = [...current.classes];
                          nextClasses[index] = { ...nextClasses[index], dayName: newDay };
                          return { ...current, classes: nextClasses };
                        });
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveEdit}
                className="rounded-xl bg-sky-500 px-4 py-2 font-semibold text-slate-900 hover:bg-sky-400 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditCycleDraft(null)}
                className="rounded-xl border border-sky-400/30 px-4 py-2 font-semibold text-slate-200 hover:bg-[#091226]"
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}

      <div className="space-y-3">
        {cycles.length === 0 ? (
          <p className="text-sm text-slate-300">No completed 12-class cycles yet.</p>
        ) : (
          cycles.map((cycle) => (
            <div key={cycle.id} className="rounded-xl border border-sky-400/20 bg-[#091226] p-3">
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setExpandedCycleId((current) => (current === cycle.id ? null : cycle.id))}
                  className="flex flex-col items-start gap-1 text-left"
                >
                  <span className="font-semibold text-sky-200">{cycle.studentName}</span>
                  <span className="text-xs text-slate-300">
                    {cycle.startDate} → {cycle.endDate}
                  </span>
                  <span className="text-xs text-slate-300">Classes Taken: 12/12</span>
                </button>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => openEditCycle(cycle)}
                    className="rounded-lg border border-sky-400/40 bg-sky-500/10 px-2 py-1 text-xs font-semibold text-sky-200 hover:bg-sky-500/20"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onDeleteCycle(cycle.id);
                    }}
                    className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => void onTogglePayment(cycle.id, !cycle.paymentGiven)}
                  className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${
                    cycle.paymentGiven
                      ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                      : "border border-rose-400/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                  }`}
                >
                  Payment Given: {cycle.paymentGiven ? "Yes" : "No"}
                </button>
              </div>

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
