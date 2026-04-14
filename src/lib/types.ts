export type Month = {
  id: number;
  year: number;
  month: number;
  label: string;
};

export type DayRow = {
  id: number;
  dateIso: string;
  dayName: string;
};

export type Settings = {
  studentCount: number;
  names: string[];
};

export type CycleClass = {
  id: number;
  classNumber: number;
  dateIso: string;
  dayName: string;
  studentName: string;
};

export type Cycle = {
  id: number;
  studentIndex: number;
  studentName: string;
  startDate: string;
  endDate: string;
  paymentGiven: boolean;
  classes: CycleClass[];
};

export type TrackerState = {
  settings: Settings;
  months: Month[];
  selectedMonthId: number;
  days: DayRow[];
  checkedByDay: Record<string, number[]>;
  cycles: Cycle[];
};
