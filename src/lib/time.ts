const DHAKA_TIMEZONE = "Asia/Dhaka";

export function getDhakaNowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DHAKA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
}

export function getDhakaMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA_TIMEZONE,
    month: "long",
    year: "numeric",
  }).format(new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+06:00`));
}

export function getDhakaDayName(dateIso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA_TIMEZONE,
    weekday: "long",
  }).format(new Date(`${dateIso}T00:00:00+06:00`));
}

export function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}
