"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewEventPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("wedding"); // wedding | teambuilding | other
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [guestsAdults, setGuestsAdults] = useState<number>(0);
  const [guestsKids, setGuestsKids] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function createEvent() {
    setErr("");
    setLoading(true);

    // Check login
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      router.push("/login");
      return;
    }

    // Insert into DB (matches your schema)
    const { data, error } = await supabase
      .from("events")
      .insert({
        title,
        event_type: eventType,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        guests_adults: guestsAdults || 0,
        guests_kids: guestsKids || 0,
        status: "lead",
        notes,
      })
      .select("id")
      .single();

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    router.push(`/events/${data.id}`);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl text-[#c9a84c] tracking-widest uppercase">
          New event
        </h1>
        <p className="text-white/40 mt-2">
          Create a new wedding / teambuilding event.
        </p>

        <div className="mt-8 border border-white/10 bg-white/5 p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="text-white/60 text-sm">Title</label>
            <input
              className="w-full mt-2 bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#c9a84c]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Novákovi / DCOS Teambuilding"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-white/60 text-sm">Event type</label>
            <select
              className="w-full mt-2 bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#c9a84c]"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="wedding">wedding</option>
              <option value="teambuilding">teambuilding</option>
              <option value="other">other</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-sm">Date from</label>
              <input
                type="date"
                className="w-full mt-2 bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#c9a84c]"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-white/60 text-sm">Date to</label>
              <input
                type="date"
                className="w-full mt-2 bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#c9a84c]"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Guests */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-sm">Adults</label>
              <input
                type="number"
                className="w-full mt-2 bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#c9a84c]"
                value={guestsAdults}
                onChange={(e) =>
                  setGuestsAdults(parseInt(e.target.value || "0", 10))
                }
              />
            </div>
            <div>
              <label className="text-white/60 text-sm">Kids</label>
              <input
                type="number"
                className="w-full mt-2 bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#c9a84c]"
                value={guestsKids}
                onChange={(e) =>
                  setGuestsKids(parseInt(e.target.value || "0", 10))
                }
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-white/60 text-sm">Notes</label>
            <textarea
              className="w-full mt-2 bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#c9a84c]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Client notes, requirements, meeting summary..."
            />
          </div>

          {/* Error */}
          {err && <div className="text-red-400 text-sm">{err}</div>}

          {/* Submit */}
          <button
            onClick={createEvent}
            disabled={loading || !title}
            className="w-full bg-[#c9a84c] text-black py-3 font-medium tracking-widest uppercase hover:bg-[#e0c070] transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create event"}
          </button>
        </div>
      </div>
    </main>
  );
}
