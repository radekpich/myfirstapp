"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Event = {
  id: string;
  title: string;
  event_type: string | null;
  varianta_akce: string | null;
  date_from: string | null;
  date_to: string | null;
  guests_adults: number;
  guests_kids: number;
  guests_kids_u5: number;
  status: string;
  discount_amount: number;
  discount_reason: string | null;
  internal_notes: string | null;
  meeting_notes: string | null;
  created_at: string;
  clients: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
};

type Task = {
  id: string;
  title: string;
  done: boolean;
  due_date: string | null;
  notes: string | null;
  profiles: { full_name: string | null } | null;
};

type Payment = {
  id: string;
  type: string;
  amount: number;
  due_date: string | null;
  paid_at: string | null;
  status: string;
  notes: string | null;
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUSES = [
  { value: "lead", label: "Poptávka", color: "#6b7280" },
  { value: "offer_sent", label: "Nabídka odeslána", color: "#a78bfa" },
  { value: "meeting_planned", label: "Schůzka naplánována", color: "#60a5fa" },
  { value: "meeting_done", label: "Schůzka proběhla", color: "#34d399" },
  { value: "deposit_pending", label: "Čeká na zálohu č.1", color: "#f59e0b" },
  { value: "reserved", label: "Rezervováno", color: "#10b981" },
  { value: "planning", label: "Plánování", color: "#3b82f6" },
  { value: "prepay_pending", label: "Záloha č.2 odeslána", color: "#f97316" },
  { value: "ready", label: "Připraveno", color: "#22c55e" },
  { value: "in_progress", label: "Probíhá", color: "#06b6d4" },
  {
    value: "settlement_pending",
    label: "Čeká na vyúčtování",
    color: "#f43f5e",
  },
  { value: "completed", label: "Dokončeno", color: "#4ade80" },
  { value: "cancelled", label: "Zrušeno", color: "#ef4444" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function statusInfo(s: string) {
  return STATUSES.find((x) => x.value === s) || { label: s, color: "#6b7280" };
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtDateShort(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
  });
}

function fmtMoney(n: number) {
  return n.toLocaleString("cs-CZ") + " Kč";
}

function nightCount(from: string | null, to: string | null) {
  if (!from || !to) return 0;
  return Math.max(
    0,
    Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000),
  );
}

function daysDiff(d: string | null) {
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - target.getTime()) / 86400000);
}

function Skeleton({ h = 16, w = "100%" }: { h?: number; w?: string }) {
  return (
    <div
      style={{
        height: h,
        width: w,
        borderRadius: 4,
        background: "rgba(255,255,255,0.06)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 10,
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.3)",
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "#fff",
          fontFamily: mono ? "monospace" : "inherit",
        }}
      >
        {value || <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
      </div>
    </div>
  );
}

function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#13131a",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          {title}
        </span>
        {action}
      </div>
      <div style={{ padding: "18px 20px" }}>{children}</div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [event, setEvent] = useState<Event | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "info" | "tasks" | "payments" | "notes"
  >("info");

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Event>>({});

  // Status modal
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    async function load() {
      const [eventRes, tasksRes, paymentsRes] = await Promise.all([
        supabase
          .from("events")
          .select("*, clients(id, name, email, phone)")
          .eq("id", id)
          .single(),
        supabase
          .from("tasks")
          .select("id, title, done, due_date, notes, profiles(full_name)")
          .eq("event_id", id)
          .order("due_date", { ascending: true }),
        supabase
          .from("payments")
          .select("id, type, amount, due_date, paid_at, status, notes")
          .eq("event_id", id)
          .order("created_at", { ascending: true }),
      ]);

      if (eventRes.data) {
        setEvent(eventRes.data as unknown as Event);
        setEditData(eventRes.data as unknown as Event);
      }
      setTasks((tasksRes.data as unknown as Task[]) || []);
      setPayments((paymentsRes.data as unknown as Payment[]) || []);
      setLoading(false);
    }
    load();
  }, [id]);

  // Save edits
  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("events")
      .update({
        title: editData.title,
        event_type: editData.event_type,
        varianta_akce: editData.varianta_akce,
        date_from: editData.date_from,
        date_to: editData.date_to,
        guests_adults: editData.guests_adults,
        guests_kids: editData.guests_kids,
        guests_kids_u5: editData.guests_kids_u5,
        discount_amount: editData.discount_amount,
        discount_reason: editData.discount_reason,
        internal_notes: editData.internal_notes,
        meeting_notes: editData.meeting_notes,
      })
      .eq("id", id);

    if (!error) {
      setEvent((prev) => (prev ? { ...prev, ...editData } : prev));
      setEditMode(false);
    }
    setSaving(false);
  }

  // Change status
  async function handleStatusChange(newStatus: string) {
    await supabase.from("events").update({ status: newStatus }).eq("id", id);
    setEvent((prev) => (prev ? { ...prev, status: newStatus } : prev));
    setShowStatusModal(false);
  }

  // Toggle task done
  async function toggleTask(taskId: string, done: boolean) {
    await supabase
      .from("tasks")
      .update({
        done,
        completed_at: done ? new Date().toISOString() : null,
      })
      .eq("id", taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done } : t)));
  }

  // Mark payment paid
  async function markPaymentPaid(paymentId: string) {
    await supabase
      .from("payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", paymentId);
    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? { ...p, status: "paid", paid_at: new Date().toISOString() }
          : p,
      ),
    );
  }

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0c0c0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}
        >
          Načítám...
        </div>
      </div>
    );

  if (!event)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0c0c0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#e05c5c", fontFamily: "monospace" }}>
          Akce nenalezena
        </div>
      </div>
    );

  const si = statusInfo(event.status);
  const nights = nightCount(event.date_from, event.date_to);
  const cityTax = (event.guests_adults + event.guests_kids) * nights * 40;
  const doneTasks = tasks.filter((t) => t.done).length;
  const paidTotal = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        input, textarea, select { font-family: inherit; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: rgba(201,168,76,0.5) !important; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#0c0c0f",
          color: "rgba(255,255,255,0.82)",
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          fontSize: 14,
        }}
      >
        {/* Sidebar */}
        <SimpleSidebar active="akce" />

        {/* Main */}
        <div style={{ marginLeft: 220, padding: "28px 32px 60px" }}>
          {/* Back + breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <a
              href="/akce"
              style={{
                color: "rgba(255,255,255,0.35)",
                textDecoration: "none",
              }}
            >
              ← Akce
            </a>
            <span>/</span>
            <span style={{ color: "rgba(255,255,255,0.6)" }}>
              {event.title}
            </span>
          </div>

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  {event.title}
                </h1>
                {/* Status badge — clickable */}
                <button
                  onClick={() => setShowStatusModal(true)}
                  style={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: `${si.color}18`,
                    color: si.color,
                    border: `1px solid ${si.color}35`,
                  }}
                >
                  {si.label} ▾
                </button>
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                {event.clients?.name && <span>{event.clients.name} · </span>}
                {fmtDate(event.date_from)}
                {event.date_to && event.date_to !== event.date_from
                  ? ` — ${fmtDate(event.date_to)}`
                  : ""}
                {nights > 0 && (
                  <span style={{ color: "rgba(255,255,255,0.25)" }}>
                    {" "}
                    · {nights} nocí
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {editMode ? (
                <>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setEditData(event);
                    }}
                    style={{
                      padding: "9px 16px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "transparent",
                      color: "rgba(255,255,255,0.6)",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    Zrušit
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 8,
                      border: "none",
                      background: "#c9a84c",
                      color: "#0c0c0f",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {saving ? "Ukládám..." : "Uložit"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      padding: "9px 16px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.7)",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    ✏ Upravit
                  </button>
                  <a
                    href={`/kalkulace/${id}`}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 8,
                      border: "none",
                      background: "#c9a84c",
                      color: "#0c0c0f",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    💰 Kalkulace
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Quick summary strips */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5,1fr)",
              gap: 10,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: "Hosté",
                value: `${event.guests_adults} dospělých${event.guests_kids > 0 ? ` + ${event.guests_kids} dětí` : ""}`,
              },
              { label: "Nocí", value: nights > 0 ? String(nights) : "1 den" },
              {
                label: "Poplatek městu",
                value: cityTax > 0 ? fmtMoney(cityTax) : "—",
              },
              {
                label: `Úkoly (${doneTasks}/${tasks.length})`,
                value:
                  tasks.length > 0
                    ? `${Math.round((doneTasks / tasks.length) * 100)}%`
                    : "—",
              },
              {
                label: "Zaplaceno",
                value: paidTotal > 0 ? fmtMoney(paidTotal) : "—",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#13131a",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 8,
                  padding: "12px 16px",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: "monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: 6,
                  }}
                >
                  {s.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 0,
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              marginBottom: 24,
            }}
          >
            {(["info", "tasks", "payments", "notes"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  padding: "10px 20px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: activeTab === t ? 600 : 400,
                  color: activeTab === t ? "#c9a84c" : "rgba(255,255,255,0.4)",
                  borderBottom:
                    activeTab === t
                      ? "2px solid #c9a84c"
                      : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {t === "info"
                  ? "ℹ Základní info"
                  : t === "tasks"
                    ? `✅ Úkoly (${doneTasks}/${tasks.length})`
                    : t === "payments"
                      ? `💳 Platby`
                      : "📝 Poznámky"}
              </button>
            ))}
          </div>

          {/* Tab: INFO */}
          {activeTab === "info" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {/* Left */}
              <div>
                <Card title="Detaily akce">
                  {editMode ? (
                    <>
                      <EditField
                        label="Název akce"
                        value={editData.title || ""}
                        onChange={(v) =>
                          setEditData((p) => ({ ...p, title: v }))
                        }
                      />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                        }}
                      >
                        <EditSelect
                          label="Typ akce"
                          value={editData.event_type || ""}
                          onChange={(v) =>
                            setEditData((p) => ({ ...p, event_type: v }))
                          }
                          options={[
                            ["wedding", "💍 Svatba"],
                            ["teambuilding", "🏆 Teambuilding"],
                            ["party", "🎉 Párty"],
                            ["accommodation", "🛏️ Ubytování"],
                            ["corporate", "🏢 Firemní"],
                            ["other", "📅 Jiné"],
                          ]}
                        />
                        <EditSelect
                          label="Varianta"
                          value={editData.varianta_akce || ""}
                          onChange={(v) =>
                            setEditData((p) => ({ ...p, varianta_akce: v }))
                          }
                          options={[
                            ["Pronájem", "Pronájem"],
                            ["Vlastní catering", "Vlastní catering"],
                            ["Pouze ubytování", "Pouze ubytování"],
                          ]}
                        />
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                        }}
                      >
                        <EditField
                          label="Datum od"
                          type="date"
                          value={editData.date_from || ""}
                          onChange={(v) =>
                            setEditData((p) => ({ ...p, date_from: v }))
                          }
                        />
                        <EditField
                          label="Datum do"
                          type="date"
                          value={editData.date_to || ""}
                          onChange={(v) =>
                            setEditData((p) => ({ ...p, date_to: v }))
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <Field label="Typ akce" value={event.event_type} />
                      <Field label="Varianta" value={event.varianta_akce} />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                        }}
                      >
                        <Field
                          label="Datum od"
                          value={fmtDate(event.date_from)}
                          mono
                        />
                        <Field
                          label="Datum do"
                          value={fmtDate(event.date_to)}
                          mono
                        />
                      </div>
                    </>
                  )}
                </Card>

                <Card title="Hosté">
                  {editMode ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 12,
                      }}
                    >
                      <EditField
                        label="Dospělí"
                        type="number"
                        value={String(editData.guests_adults || 0)}
                        onChange={(v) =>
                          setEditData((p) => ({
                            ...p,
                            guests_adults: Number(v),
                          }))
                        }
                      />
                      <EditField
                        label="Děti (u stolu)"
                        type="number"
                        value={String(editData.guests_kids || 0)}
                        onChange={(v) =>
                          setEditData((p) => ({ ...p, guests_kids: Number(v) }))
                        }
                      />
                      <EditField
                        label="Děti do 5 let"
                        type="number"
                        value={String(editData.guests_kids_u5 || 0)}
                        onChange={(v) =>
                          setEditData((p) => ({
                            ...p,
                            guests_kids_u5: Number(v),
                          }))
                        }
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 12,
                      }}
                    >
                      <Field label="Dospělí" value={event.guests_adults} />
                      <Field label="Děti (u stolu)" value={event.guests_kids} />
                      <Field
                        label="Děti do 5 let"
                        value={event.guests_kids_u5}
                      />
                    </div>
                  )}
                  {nights > 0 && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: "10px 14px",
                        background: "rgba(201,168,76,0.06)",
                        border: "1px solid rgba(201,168,76,0.15)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      Poplatek městu: ({event.guests_adults} +{" "}
                      {event.guests_kids}) × {nights} nocí × 40 Kč ={" "}
                      <strong style={{ color: "#c9a84c" }}>
                        {fmtMoney(cityTax)}
                      </strong>
                    </div>
                  )}
                </Card>

                <Card title="Sleva">
                  {editMode ? (
                    <>
                      <EditField
                        label="Sleva (Kč)"
                        type="number"
                        value={String(editData.discount_amount || 0)}
                        onChange={(v) =>
                          setEditData((p) => ({
                            ...p,
                            discount_amount: Number(v),
                          }))
                        }
                      />
                      <EditField
                        label="Důvod slevy"
                        value={editData.discount_reason || ""}
                        onChange={(v) =>
                          setEditData((p) => ({ ...p, discount_reason: v }))
                        }
                      />
                    </>
                  ) : (
                    <>
                      <Field
                        label="Sleva"
                        value={
                          event.discount_amount > 0
                            ? fmtMoney(event.discount_amount)
                            : "Bez slevy"
                        }
                      />
                      {event.discount_reason && (
                        <Field label="Důvod" value={event.discount_reason} />
                      )}
                    </>
                  )}
                </Card>
              </div>

              {/* Right */}
              <div>
                {event.clients && (
                  <Card
                    title="Klient"
                    action={
                      <a
                        href={`/klienti/${event.clients.id}`}
                        style={{
                          fontSize: 11,
                          color: "#c9a84c",
                          fontFamily: "monospace",
                          textDecoration: "none",
                        }}
                      >
                        Profil →
                      </a>
                    }
                  >
                    <Field label="Jméno" value={event.clients.name} />
                    <Field label="Email" value={event.clients.email} />
                    <Field label="Telefon" value={event.clients.phone} mono />
                  </Card>
                )}

                {/* Status timeline */}
                <Card title="Průběh akce — status">
                  <div style={{ position: "relative" }}>
                    {STATUSES.filter((s) => s.value !== "cancelled").map(
                      (s, i) => {
                        const currentIdx = STATUSES.findIndex(
                          (x) => x.value === event.status,
                        );
                        const thisIdx = STATUSES.findIndex(
                          (x) => x.value === s.value,
                        );
                        const isDone = thisIdx < currentIdx;
                        const isCurrent = s.value === event.status;
                        return (
                          <div
                            key={s.value}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              marginBottom: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: isCurrent
                                  ? s.color
                                  : isDone
                                    ? `${s.color}40`
                                    : "rgba(255,255,255,0.06)",
                                border: isCurrent
                                  ? `2px solid ${s.color}`
                                  : isDone
                                    ? `1px solid ${s.color}60`
                                    : "1px solid rgba(255,255,255,0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 9,
                                color: isDone ? s.color : "transparent",
                              }}
                            >
                              {isDone ? "✓" : ""}
                            </div>
                            <span
                              style={{
                                fontSize: 12,
                                color: isCurrent
                                  ? "#fff"
                                  : isDone
                                    ? "rgba(255,255,255,0.4)"
                                    : "rgba(255,255,255,0.2)",
                                fontWeight: isCurrent ? 600 : 400,
                              }}
                            >
                              {s.label}
                            </span>
                            {isCurrent && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontFamily: "monospace",
                                  background: `${s.color}20`,
                                  color: s.color,
                                  padding: "2px 6px",
                                  borderRadius: 8,
                                  border: `1px solid ${s.color}30`,
                                }}
                              >
                                AKTUÁLNÍ
                              </span>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                  <button
                    onClick={() => setShowStatusModal(true)}
                    style={{
                      width: "100%",
                      marginTop: 14,
                      padding: "9px",
                      background: "rgba(201,168,76,0.08)",
                      border: "1px solid rgba(201,168,76,0.2)",
                      borderRadius: 7,
                      color: "#c9a84c",
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: "monospace",
                    }}
                  >
                    Změnit status →
                  </button>
                </Card>
              </div>
            </div>
          )}

          {/* Tab: TASKS */}
          {activeTab === "tasks" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                  {doneTasks} / {tasks.length} úkolů dokončeno
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 2,
                    margin: "0 20px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${tasks.length > 0 ? (doneTasks / tasks.length) * 100 : 0}%`,
                      background: "#4caf7d",
                      borderRadius: 2,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
                <button
                  style={{
                    padding: "8px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 7,
                    color: "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  ＋ Přidat úkol
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {tasks.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "rgba(255,255,255,0.25)",
                    }}
                  >
                    Žádné úkoly
                  </div>
                ) : (
                  tasks.map((task) => {
                    const overdue =
                      task.due_date &&
                      !task.done &&
                      daysDiff(task.due_date)! > 0;
                    return (
                      <div
                        key={task.id}
                        style={{
                          background: "#13131a",
                          border: `1px solid ${overdue ? "rgba(224,92,92,0.2)" : "rgba(255,255,255,0.07)"}`,
                          borderRadius: 8,
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          opacity: task.done ? 0.5 : 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={(e) =>
                            toggleTask(task.id, e.target.checked)
                          }
                          style={{
                            width: 18,
                            height: 18,
                            cursor: "pointer",
                            accentColor: "#4caf7d",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              textDecoration: task.done
                                ? "line-through"
                                : "none",
                              color: task.done
                                ? "rgba(255,255,255,0.4)"
                                : "#fff",
                            }}
                          >
                            {task.title}
                          </div>
                          {task.profiles?.full_name && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,0.3)",
                                marginTop: 2,
                              }}
                            >
                              {task.profiles.full_name}
                            </div>
                          )}
                        </div>
                        {task.due_date && (
                          <div
                            style={{
                              fontSize: 11,
                              fontFamily: "monospace",
                              color: overdue
                                ? "#e05c5c"
                                : "rgba(255,255,255,0.35)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {overdue
                              ? `⚠ ${daysDiff(task.due_date)}d po splatnosti`
                              : fmtDateShort(task.due_date)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab: PAYMENTS */}
          {activeTab === "payments" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: 16,
                }}
              >
                <button
                  style={{
                    padding: "8px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 7,
                    color: "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  ＋ Přidat platbu
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {payments.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "rgba(255,255,255,0.25)",
                    }}
                  >
                    Žádné platby
                  </div>
                ) : (
                  payments.map((p) => {
                    const overdue =
                      p.status === "pending" &&
                      p.due_date &&
                      daysDiff(p.due_date)! > 0;
                    const typeLabel =
                      p.type === "deposit"
                        ? "Záloha č.1"
                        : p.type === "prepay"
                          ? "Záloha č.2"
                          : "Vyúčtování";
                    return (
                      <div
                        key={p.id}
                        style={{
                          background: "#13131a",
                          border: `1px solid ${overdue ? "rgba(224,92,92,0.25)" : "rgba(255,255,255,0.07)"}`,
                          borderRadius: 8,
                          padding: "16px 20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              color: "#fff",
                              marginBottom: 4,
                            }}
                          >
                            {typeLabel}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "rgba(255,255,255,0.35)",
                            }}
                          >
                            Splatnost: {fmtDate(p.due_date)}
                            {p.paid_at && (
                              <span style={{ color: "#4caf7d" }}>
                                {" "}
                                · Zaplaceno {fmtDate(p.paid_at)}
                              </span>
                            )}
                            {overdue && (
                              <span style={{ color: "#e05c5c" }}>
                                {" "}
                                · ⚠ {daysDiff(p.due_date)}d po splatnosti
                              </span>
                            )}
                          </div>
                          {p.notes && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,0.25)",
                                marginTop: 4,
                              }}
                            >
                              {p.notes}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "monospace",
                              fontSize: 18,
                              fontWeight: 700,
                              color:
                                p.status === "paid"
                                  ? "#4caf7d"
                                  : overdue
                                    ? "#e05c5c"
                                    : "#c9a84c",
                            }}
                          >
                            {fmtMoney(p.amount)}
                          </div>
                          {p.status === "pending" ? (
                            <button
                              onClick={() => markPaymentPaid(p.id)}
                              style={{
                                padding: "7px 14px",
                                background: "rgba(76,175,125,0.12)",
                                border: "1px solid rgba(76,175,125,0.25)",
                                borderRadius: 7,
                                color: "#4caf7d",
                                cursor: "pointer",
                                fontSize: 12,
                                fontFamily: "monospace",
                              }}
                            >
                              Označit zaplaceno
                            </button>
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                fontFamily: "monospace",
                                padding: "4px 10px",
                                borderRadius: 20,
                                background: "rgba(76,175,125,0.1)",
                                color: "#4caf7d",
                                border: "1px solid rgba(76,175,125,0.2)",
                              }}
                            >
                              ✓ Zaplaceno
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Payment summary */}
              {payments.length > 0 && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "14px 20px",
                    background: "#13131a",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>
                      Celkem zaplaceno:
                    </span>
                    <span
                      style={{
                        color: "#4caf7d",
                        fontFamily: "monospace",
                        fontWeight: 700,
                      }}
                    >
                      {fmtMoney(paidTotal)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      marginTop: 6,
                    }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>
                      Zbývá zaplatit:
                    </span>
                    <span
                      style={{
                        color: "#c9a84c",
                        fontFamily: "monospace",
                        fontWeight: 700,
                      }}
                    >
                      {fmtMoney(
                        payments
                          .filter((p) => p.status !== "paid")
                          .reduce((s, p) => s + p.amount, 0),
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: NOTES */}
          {activeTab === "notes" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <Card title="Interní poznámky (pouze pro tým)">
                <textarea
                  value={editData.internal_notes || ""}
                  onChange={(e) =>
                    setEditData((p) => ({
                      ...p,
                      internal_notes: e.target.value,
                    }))
                  }
                  rows={10}
                  placeholder="Poznámky pro tým — kód od brány, kde parkovat..."
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 7,
                    color: "#fff",
                    fontSize: 13,
                    padding: "12px 14px",
                    resize: "vertical",
                  }}
                />
                <button
                  onClick={async () => {
                    await supabase
                      .from("events")
                      .update({ internal_notes: editData.internal_notes })
                      .eq("id", id);
                    setEvent((p) =>
                      p
                        ? {
                            ...p,
                            internal_notes: editData.internal_notes || null,
                          }
                        : p,
                    );
                  }}
                  style={{
                    marginTop: 10,
                    padding: "8px 16px",
                    background: "#c9a84c",
                    border: "none",
                    borderRadius: 7,
                    color: "#0c0c0f",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Uložit
                </button>
              </Card>
              <Card title="Poznámky ze schůzek">
                <textarea
                  value={editData.meeting_notes || ""}
                  onChange={(e) =>
                    setEditData((p) => ({
                      ...p,
                      meeting_notes: e.target.value,
                    }))
                  }
                  rows={10}
                  placeholder="Co se řešilo na schůzkách s klientem..."
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 7,
                    color: "#fff",
                    fontSize: 13,
                    padding: "12px 14px",
                    resize: "vertical",
                  }}
                />
                <button
                  onClick={async () => {
                    await supabase
                      .from("events")
                      .update({ meeting_notes: editData.meeting_notes })
                      .eq("id", id);
                    setEvent((p) =>
                      p
                        ? {
                            ...p,
                            meeting_notes: editData.meeting_notes || null,
                          }
                        : p,
                    );
                  }}
                  style={{
                    marginTop: 10,
                    padding: "8px 16px",
                    background: "#c9a84c",
                    border: "none",
                    borderRadius: 7,
                    color: "#0c0c0f",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Uložit
                </button>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* STATUS MODAL */}
      {showStatusModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowStatusModal(false)}
        >
          <div
            style={{
              background: "#1a1a24",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: 24,
              width: 360,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.35)",
                marginBottom: 16,
              }}
            >
              Změnit status
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 7,
                    border: "1px solid",
                    borderColor:
                      event.status === s.value
                        ? s.color
                        : "rgba(255,255,255,0.07)",
                    background:
                      event.status === s.value
                        ? `${s.color}15`
                        : "rgba(255,255,255,0.02)",
                    color:
                      event.status === s.value
                        ? s.color
                        : "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: event.status === s.value ? 600 : 400,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: s.color,
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  {s.label}
                  {event.status === s.value && (
                    <span style={{ marginLeft: "auto", fontSize: 10 }}>
                      ✓ aktuální
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── EDIT HELPERS ─────────────────────────────────────────────────────────────

function EditField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 10,
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.3)",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "9px 12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 7,
          color: "#fff",
          fontSize: 13,
        }}
      />
    </div>
  );
}

function EditSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 10,
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.3)",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "9px 12px",
          background: "#13131a",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 7,
          color: "#fff",
          fontSize: 13,
        }}
      >
        <option value="">— vyberte —</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── SIMPLE SIDEBAR ───────────────────────────────────────────────────────────

function SimpleSidebar({ active }: { active: string }) {
  const nav = [
    { key: "dashboard", icon: "◼", label: "Dashboard", href: "/dashboard" },
    { key: "poptavky", icon: "◈", label: "Poptávky", href: "/poptavky" },
    { key: "klienti", icon: "◉", label: "Klienti", href: "/klienti" },
    { key: "akce", icon: "◎", label: "Akce", href: "/akce" },
    { key: "kalkulace", icon: "◇", label: "Kalkulace", href: "/kalkulace" },
    { key: "ukoly", icon: "◻", label: "Úkoly", href: "/ukoly" },
    { key: "platby", icon: "△", label: "Platby", href: "/platby" },
    { key: "zisk", icon: "▽", label: "Zisk & náklady", href: "/zisk" },
    { key: "ubytovani", icon: "○", label: "Ubytování", href: "/ubytovani" },
    { key: "katalog", icon: "□", label: "Katalog", href: "/katalog" },
  ];
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: 220,
        background: "#13131a",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
    >
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 18,
            fontWeight: 700,
            color: "#c9a84c",
          }}
        >
          EVAVIO
        </div>
        <div
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.3)",
            marginTop: 2,
            fontFamily: "monospace",
          }}
        >
          Ranč Na Valech
        </div>
      </div>
      <nav style={{ padding: "16px 12px", flex: 1 }}>
        {nav.map((item) => (
          <a
            key={item.key}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 10px",
              borderRadius: 7,
              marginBottom: 2,
              background:
                active === item.key ? "rgba(201,168,76,0.1)" : "transparent",
              color: active === item.key ? "#c9a84c" : "rgba(255,255,255,0.45)",
              fontWeight: active === item.key ? 500 : 400,
              fontSize: 13,
              borderLeft:
                active === item.key
                  ? "2px solid #c9a84c"
                  : "2px solid transparent",
              textDecoration: "none",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                width: 14,
                textAlign: "center",
              }}
            >
              {item.icon}
            </span>
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
