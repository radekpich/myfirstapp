"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [events, setEvents] = useState<EventRow[]>([]);
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
      setEmail(userData.user.email ?? "");

      const { data, error } = await supabase
        .from("events")
        .select(
          "id,title,event_type,date_from,date_to,guests_adults,guests_kids,status,created_at",
        )
        .order("date_from", { ascending: true, nullsFirst: false });

      if (error) setErr(error.message);
      setEvents((data ?? []) as EventRow[]);
      setLoading(false);
    }

    load();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-10">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl text-[#c9a84c] tracking-widest uppercase">
            Dashboard
          </h1>
          <p className="text-white/50 mt-2">Logged in as: {email}</p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/catalog"
            className="border border-white/20 px-4 py-2 hover:border-white/50 transition"
          >
            Catalog
          </Link>
          <Link
            href="/events/new"
            className="bg-[#c9a84c] text-black px-4 py-2 font-medium hover:bg-[#e0c070] transition"
          >
            + New event
          </Link>
          <button
            onClick={logout}
            className="border border-white/20 px-4 py-2 hover:border-white/50 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mt-10 border border-white/10 bg-white/5">
        <div className="px-6 py-4 border-b border-white/10 text-white/70">
          Events
        </div>

        {loading && <div className="p-6 text-white/60">Loading...</div>}
        {err && <div className="p-6 text-red-400">{err}</div>}

        {!loading && !err && events.length === 0 && (
          <div className="p-6 text-white/60">
            No events yet. Click <b>New event</b>.
          </div>
        )}

        {!loading && !err && events.length > 0 && (
          <div className="divide-y divide-white/10">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="block px-6 py-4 hover:bg-white/5 transition"
              >
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <div className="text-lg">{e.title}</div>
                    <div className="text-white/50 text-sm">
                      {e.event_type} • {e.status} • guests:{" "}
                      {e.guests_adults + e.guests_kids}
                    </div>
                  </div>
                  <div className="text-white/40 text-sm">
                    {e.date_from ?? "—"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
