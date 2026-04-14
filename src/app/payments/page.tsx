import { redirect } from "next/navigation";
import PaymentsApp from "@/components/payments-app";
import { getSession } from "@/lib/auth";
import { getTrackerState } from "@/lib/repository";

export default async function PaymentsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const state = await getTrackerState();

  return <PaymentsApp initialState={state} username={session.username} />;
}
