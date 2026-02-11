import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
import { StrategyChat } from "../strategy-chat";

export default async function StrategyChatPage({
  params,
}: {
  params: Promise<{ eventKey: string }>;
}) {
  const { eventKey } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) redirect("/join");

  const { data: event } = await supabase
    .from("events")
    .select("name, year, location")
    .eq("tba_key", eventKey)
    .single();

  if (!event) {
    return (
      <div className="min-h-screen dashboard-page">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 pb-12 pt-24">
          <div className="rounded-2xl dashboard-panel p-8 text-center">
            <p className="text-gray-400">
              Event not found. Sync it first from the dashboard.
            </p>
            <Link href="/dashboard" className="back-button mt-4">
              Back to dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const eventTitle = event.year ? `${event.year} ${event.name}` : event.name;

  return (
    <div className="min-h-screen dashboard-page">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-12 pt-24 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              Strategy chat
            </p>
            <h1 className="text-2xl font-bold text-white">{eventTitle}</h1>
            <p className="text-sm text-gray-400">
              Ask about opponents, allies, and matchups for this event.
            </p>
          </div>
          <Link href={`/dashboard/events/${eventKey}`} className="back-button">
            Back
          </Link>
        </div>

        <StrategyChat eventKey={eventKey} />
      </main>
    </div>
  );
}
