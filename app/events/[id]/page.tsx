"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type EventRow = {
  id: string;
  title: string;
  event_type: string;
  date_from: string | null;
  date_to: string | null;
  guests_adults: number;
  guests_kids: number;
  status: string;
  notes: string | null;
  created_at: string;
};

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = useMemo(
    () => (Array.isArray(params.id) ? params.id[0] : params.id),
    [params.id],
  );
  const router = useRouter();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      setErr("");
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("events")
        .select(
          "id,title,event_type,date_from,date_to,guests_adults,guests_kids,status,notes,created_at",
        )
        .eq("id", eventId)
        .single();

      if (error) setErr(error.message);
      setEvent((data ?? null) as EventRow | null);
      setLoading(false);
    }

    if (eventId) load();
  }, [eventId, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white p-10">
        <div className="text-white/60">Loading event...</div>
      </main>
    );
  }

  if (err || !event) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white p-10">
        <Link className="text-[#c9a84c] underline" href="/dashboard">
          ← Back to dashboard
        </Link>
        <div className="mt-6 text-red-400">{err || "Event not found"}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <Link className="text-[#c9a84c] underline" href="/dashboard">
            ← Back to dashboard
          </Link>

          <h1 className="mt-4 text-3xl text-[#c9a84c] tracking-widest uppercase">
            {event.title}
          </h1>

          <p className="text-white/50 mt-2">
            {event.event_type} • {event.status}
          </p>
        </div>

        <div className="text-right text-white/50 text-sm">
          <div>From: {event.date_from ?? "—"}</div>
          <div>To: {event.date_to ?? "—"}</div>
          <div className="mt-2">
            Guests: {event.guests_adults} adults, {event.guests_kids} kids
          </div>
        </div>
      </div>

      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <div className="border border-white/10 bg-white/5 p-6">
          <h2 className="text-white/80 mb-3">Notes</h2>
          <div className="text-white/50 whitespace-pre-wrap">
            {event.notes || "—"}
          </div>
        </div>

        <div className="border border-white/10 bg-white/5 p-6">
          <h2 className="text-white/80 mb-3">Next steps</h2>
          <ul className="text-white/50 space-y-2">
            <li>• Add catalog (price list)</li>
            <li>• Add items to this event (calculation)</li>
            <li>• Export offer / summary</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
