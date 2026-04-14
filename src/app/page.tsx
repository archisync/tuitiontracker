import { redirect } from "next/navigation";
import TrackerApp from "@/components/tracker-app";
import { getSession } from "@/lib/auth";
import { getTrackerState } from "@/lib/repository";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const state = await getTrackerState();

  return <TrackerApp initialState={state} username={session.username} />;
}
