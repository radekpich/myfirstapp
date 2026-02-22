"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Event = {
  id: string;
  title: string;
  event_type: string;
  date_from: string;
  date_to: string;
  guests_adults: number;
  guests_kids: number;
  status: string;
};

type Task = {
  id: string;
  title: string;
  due_date: string;
  events: { title: string } | null;
};

type Payment = {
  id: string;
  type: string;
  amount: number;
  due_date: string;
  events: { title: string } | null;
};

type Lead = {
  id: string;
  name: string;
  event_type: string;
  source: string;
  status: string;
  created_at: string;
};

type Stats = {
  upcomingCount: number;
  openLeads: number;
  overdueTasksCount: number;
  overduePaymentsTotal: number;
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function statusColor(s: string) {
  const m: Record<string, string> = {
    lead: "#6b7280",
    offer_sent: "#a78bfa",
    meeting_planned: "#60a5fa",
    meeting_done: "#34d399",
    deposit_pending: "#f59e0b",
    reserved: "#10b981",
    planning: "#3b82f6",
    prepay_pending: "#f97316",
    ready: "#22c55e",
    in_progress: "#06b6d4",
    settlement_pending: "#f43f5e",
    completed: "#4ade80",
    cancelled: "#ef4444",
  };
  return m[s] || "#6b7280";
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    lead: "Poptávka",
    offer_sent: "Nabídka odeslána",
    meeting_planned: "Schůzka naplánována",
    meeting_done: "Schůzka proběhla",
    deposit_pending: "Čeká na zálohu",
    reserved: "Rezervováno",
    planning: "Plánování",
    prepay_pending: "Čeká na zálohu č.2",
    ready: "Připraveno",
    in_progress: "Probíhá",
    settlement_pending: "Čeká na vyúčtování",
    completed: "Dokončeno",
    cancelled: "Zrušeno",
  };
  return m[s] || s;
}

function typeIcon(t: string) {
  const m: Record<string, string> = {
    wedding: "💍",
    teambuilding: "🏆",
    party: "🎉",
    accommodation: "🛏️",
    corporate: "🏢",
  };
  return m[t] || "📅";
}

function leadStatusLabel(s: string) {
  const m: Record<string, string> = {
    new: "Nová",
    contacted: "Kontaktováno",
    offer_sent: "Nabídka",
    meeting_planned: "Schůzka",
    meeting_done: "Po schůzce",
    converted: "Konvertováno",
    lost: "Ztraceno",
  };
  return m[s] || s;
}

function sourceLabel(s: string) {
  const m: Record<string, string> = {
    instagram: "Instagram",
    website: "Web",
    phone: "Telefon",
    referral: "Doporučení",
    google: "Google",
  };
  return m[s] || s;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
  });
}

function fmtMoney(n: number) {
  return n.toLocaleString("cs-CZ") + " Kč";
}

function daysDiff(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - d.getTime()) / 86400000);
}

// ─── MINI CALENDAR ────────────────────────────────────────────────────────────

function MiniCalendar({ events }: { events: Event[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = today.toLocaleDateString("cs-CZ", {
    month: "long",
    year: "numeric",
  });
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const cells: (number | null)[] = Array(startOffset).fill(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const bookedDays = new Set<number>();
  events.forEach((ev) => {
    if (!ev.date_from) return;
    const from = new Date(ev.date_from);
    const to = ev.date_to ? new Date(ev.date_to) : from;
    if (from.getFullYear() === year && from.getMonth() === month) {
      for (
        let d = from.getDate();
        d <= Math.min(to.getDate(), daysInMonth);
        d++
      ) {
        bookedDays.add(d);
      }
    }
  });

  return (
    <div>
      <p
        style={{
          color: "#c9a84c",
          fontFamily: "monospace",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: 12,
        }}
      >
        {monthName}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 2,
          marginBottom: 4,
        }}
      >
        {["Po", "Út", "St", "Čt", "Pá", "So", "Ne"].map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 9,
              color: "rgba(255,255,255,0.25)",
              fontFamily: "monospace",
              padding: "2px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 2,
        }}
      >
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isToday = day === today.getDate();
          const isBooked = bookedDays.has(day);
          return (
            <div
              key={i}
              style={{
                textAlign: "center",
                fontSize: 11,
                padding: "5px 2px",
                borderRadius: 4,
                fontFamily: "monospace",
                background: isToday
                  ? "#c9a84c"
                  : isBooked
                    ? "rgba(201,168,76,0.18)"
                    : "transparent",
                color: isToday
                  ? "#0c0c0f"
                  : isBooked
                    ? "#c9a84c"
                    : "rgba(255,255,255,0.5)",
                fontWeight: isToday || isBooked ? 600 : 400,
                border:
                  isBooked && !isToday
                    ? "1px solid rgba(201,168,76,0.3)"
                    : "1px solid transparent",
              }}
            >
              {day}
            </div>
          );
        })}
      </div>
      {events.length > 0 && (
        <div
          style={{
            marginTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {events.slice(0, 3).map((ev) => (
            <div
              key={ev.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: "#c9a84c",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: "rgba(255,255,255,0.6)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {fmtDate(ev.date_from)} — {ev.title.split("—")[0].trim()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SKELETON LOADER ──────────────────────────────────────────────────────────

function Skeleton({ w = "100%", h = 16 }: { w?: string; h?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 4,
        background: "rgba(255,255,255,0.06)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("...");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [overduePayments, setOverduePayments] = useState<Payment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({
    upcomingCount: 0,
    openLeads: 0,
    overdueTasksCount: 0,
    overduePaymentsTotal: 0,
  });
  const [tab, setTab] = useState<"tasks" | "payments">("tasks");

  // ── Load all data ────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      // 1. Get logged-in user + profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, company_id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.push("/login");
        return;
      }

      setUserName(profile.full_name || user.email || "Uživatel");
      setCompanyId(profile.company_id);
      const cid = profile.company_id;
      const today = new Date().toISOString().split("T")[0];

      // Run all queries in parallel
      const [eventsRes, tasksRes, paymentsRes, leadsRes] = await Promise.all([
        // Upcoming events (next 90 days, not cancelled/completed)
        supabase
          .from("events")
          .select(
            "id, title, event_type, date_from, date_to, guests_adults, guests_kids, status",
          )
          .eq("company_id", cid)
          .gte("date_from", today)
          .not("status", "in", '("cancelled","completed")')
          .order("date_from", { ascending: true })
          .limit(10),

        // Overdue tasks
        supabase
          .from("tasks")
          .select("id, title, due_date, events(title)")
          .eq("company_id", cid)
          .eq("done", false)
          .lt("due_date", today)
          .order("due_date", { ascending: true })
          .limit(10),

        // Overdue payments
        supabase
          .from("payments")
          .select("id, type, amount, due_date, events(title)")
          .eq("company_id", cid)
          .eq("status", "pending")
          .lt("due_date", today)
          .order("due_date", { ascending: true })
          .limit(10),

        // Open leads
        supabase
          .from("leads")
          .select("id, name, event_type, source, status, created_at")
          .eq("company_id", cid)
          .not("status", "in", '("converted","lost")')
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      setUpcomingEvents(eventsRes.data || []);
      setOverdueTasks((tasksRes.data as unknown as Task[]) || []);
      setOverduePayments((paymentsRes.data as unknown as Payment[]) || []);
      setLeads(leadsRes.data || []);

      const payTotal = (paymentsRes.data || []).reduce(
        (sum: number, p: { amount: number }) => sum + p.amount,
        0,
      );

      setStats({
        upcomingCount: eventsRes.data?.length || 0,
        openLeads: leadsRes.data?.length || 0,
        overdueTasksCount: tasksRes.data?.length || 0,
        overduePaymentsTotal: payTotal,
      });

      setLoading(false);
    }

    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // ── RENDER ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Pulse animation for skeleton */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
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
        {/* ── SIDEBAR ── */}
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
                letterSpacing: "-0.5px",
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
            {[
              {
                icon: "◼",
                label: "Dashboard",
                href: "/dashboard",
                active: true,
              },
              {
                icon: "◈",
                label: "Poptávky",
                href: "/poptavky",
                active: false,
              },
              { icon: "◉", label: "Klienti", href: "/klienti", active: false },
              { icon: "◎", label: "Akce", href: "/akce", active: false },
              {
                icon: "◇",
                label: "Kalkulace",
                href: "/kalkulace",
                active: false,
              },
              { icon: "◻", label: "Úkoly", href: "/ukoly", active: false },
              { icon: "△", label: "Platby", href: "/platby", active: false },
              {
                icon: "▽",
                label: "Zisk & náklady",
                href: "/zisk",
                active: false,
              },
              {
                icon: "○",
                label: "Ubytování",
                href: "/ubytovani",
                active: false,
              },
              { icon: "□", label: "Katalog", href: "/katalog", active: false },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 10px",
                  borderRadius: 7,
                  marginBottom: 2,
                  cursor: "pointer",
                  background: item.active
                    ? "rgba(201,168,76,0.1)"
                    : "transparent",
                  color: item.active ? "#c9a84c" : "rgba(255,255,255,0.45)",
                  fontWeight: item.active ? 500 : 400,
                  fontSize: 13,
                  borderLeft: item.active
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

          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(201,168,76,0.2)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  color: "#c9a84c",
                  fontWeight: 600,
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{userName}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                  owner
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "7px 0",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6,
                color: "rgba(255,255,255,0.4)",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              odhlásit se
            </button>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div style={{ marginLeft: 220, padding: "32px 32px 48px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 32,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#fff",
                  margin: 0,
                }}
              >
                Dashboard
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.35)",
                  margin: "4px 0 0",
                  fontSize: 13,
                }}
              >
                {new Date().toLocaleDateString("cs-CZ", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <a
                href="/poptavky/nova"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.7)",
                  padding: "9px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  textDecoration: "none",
                }}
              >
                ＋ Nová poptávka
              </a>
              <a
                href="/akce/nova"
                style={{
                  background: "#c9a84c",
                  border: "none",
                  color: "#0c0c0f",
                  padding: "9px 18px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  textDecoration: "none",
                }}
              >
                ＋ Nová akce
              </a>
            </div>
          </div>

          {/* ── STATS ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 16,
              marginBottom: 28,
            }}
          >
            {[
              {
                label: "Nadcházející akce",
                value: loading ? null : String(stats.upcomingCount),
                color: "#c9a84c",
                sub: "příštích 90 dní",
              },
              {
                label: "Otevřené poptávky",
                value: loading ? null : String(stats.openLeads),
                color: "#a78bfa",
                sub: "aktivní pipeline",
              },
              {
                label: "Zpožděné úkoly",
                value: loading ? null : String(stats.overdueTasksCount),
                color: "#e05c5c",
                sub: "potřebují pozornost",
              },
              {
                label: "Zpožděné platby",
                value: loading ? null : fmtMoney(stats.overduePaymentsTotal),
                color: "#f0884d",
                sub: "po splatnosti",
              },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  background: "#13131a",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "20px 22px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                    fontFamily: "monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 10,
                  }}
                >
                  {s.label}
                </div>
                {s.value === null ? (
                  <Skeleton h={28} w="60%" />
                ) : (
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: s.color,
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {s.value}
                  </div>
                )}
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.25)",
                    fontFamily: "monospace",
                  }}
                >
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* ── GRID ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 260px",
              gap: 20,
            }}
          >
            {/* LEFT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Upcoming events */}
              <div
                style={{
                  background: "#13131a",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "16px 22px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    Nadcházející akce
                  </span>
                  <a
                    href="/akce"
                    style={{
                      fontSize: 11,
                      color: "#c9a84c",
                      fontFamily: "monospace",
                      textDecoration: "none",
                    }}
                  >
                    Zobrazit vše →
                  </a>
                </div>
                {loading ? (
                  <div
                    style={{
                      padding: 22,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} h={20} />
                    ))}
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div
                    style={{
                      padding: 32,
                      textAlign: "center",
                      color: "rgba(255,255,255,0.25)",
                      fontSize: 13,
                    }}
                  >
                    Žádné nadcházející akce
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Akce", "Datum", "Hosté", "Status"].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              padding: "10px 22px",
                              fontSize: 10,
                              fontFamily: "monospace",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              color: "rgba(255,255,255,0.25)",
                              fontWeight: 400,
                              borderBottom: "1px solid rgba(255,255,255,0.04)",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingEvents.map((ev, i) => (
                        <tr
                          key={ev.id}
                          style={{
                            borderBottom:
                              i < upcomingEvents.length - 1
                                ? "1px solid rgba(255,255,255,0.04)"
                                : "none",
                            cursor: "pointer",
                          }}
                          onClick={() => router.push(`/akce/${ev.id}`)}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(255,255,255,0.02)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td style={{ padding: "13px 22px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <span style={{ fontSize: 16 }}>
                                {typeIcon(ev.event_type)}
                              </span>
                              <span style={{ fontWeight: 500, fontSize: 13 }}>
                                {ev.title}
                              </span>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "13px 22px",
                              color: "rgba(255,255,255,0.5)",
                              fontSize: 12,
                              fontFamily: "monospace",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {fmtDate(ev.date_from)}
                            {ev.date_to && ev.date_to !== ev.date_from
                              ? ` — ${fmtDate(ev.date_to)}`
                              : ""}
                          </td>
                          <td
                            style={{
                              padding: "13px 22px",
                              color: "rgba(255,255,255,0.5)",
                              fontSize: 12,
                              fontFamily: "monospace",
                            }}
                          >
                            {ev.guests_adults + ev.guests_kids} os.
                          </td>
                          <td style={{ padding: "13px 22px" }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: "monospace",
                                padding: "3px 8px",
                                borderRadius: 20,
                                fontWeight: 600,
                                background: `${statusColor(ev.status)}18`,
                                color: statusColor(ev.status),
                                border: `1px solid ${statusColor(ev.status)}35`,
                              }}
                            >
                              {statusLabel(ev.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Overdue tabs */}
              <div
                style={{
                  background: "#13131a",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {(["tasks", "payments"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      style={{
                        flex: 1,
                        padding: "14px 0",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 11,
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: tab === t ? "#c9a84c" : "rgba(255,255,255,0.3)",
                        borderBottom:
                          tab === t
                            ? "2px solid #c9a84c"
                            : "2px solid transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {t === "tasks"
                        ? "⚠ Zpožděné úkoly"
                        : "⚡ Zpožděné platby"}
                      <span
                        style={{
                          background:
                            t === "tasks"
                              ? "rgba(224,92,92,0.15)"
                              : "rgba(240,136,77,0.15)",
                          color: t === "tasks" ? "#e05c5c" : "#f0884d",
                          borderRadius: 10,
                          padding: "1px 6px",
                          fontSize: 10,
                        }}
                      >
                        {loading
                          ? "…"
                          : t === "tasks"
                            ? overdueTasks.length
                            : overduePayments.length}
                      </span>
                    </button>
                  ))}
                </div>
                <div style={{ padding: "8px 0" }}>
                  {loading ? (
                    <div
                      style={{
                        padding: 22,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {[1, 2].map((i) => (
                        <Skeleton key={i} h={18} />
                      ))}
                    </div>
                  ) : tab === "tasks" ? (
                    overdueTasks.length === 0 ? (
                      <div
                        style={{
                          padding: 24,
                          textAlign: "center",
                          color: "rgba(255,255,255,0.25)",
                          fontSize: 13,
                        }}
                      >
                        ✓ Žádné zpožděné úkoly
                      </div>
                    ) : (
                      overdueTasks.map((t, i) => (
                        <div
                          key={t.id}
                          style={{
                            padding: "12px 22px",
                            borderBottom:
                              i < overdueTasks.length - 1
                                ? "1px solid rgba(255,255,255,0.04)"
                                : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                marginBottom: 3,
                              }}
                            >
                              {t.title}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,0.35)",
                              }}
                            >
                              {t.events?.title}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "monospace",
                              padding: "3px 8px",
                              borderRadius: 20,
                              background: "rgba(224,92,92,0.12)",
                              color: "#e05c5c",
                              border: "1px solid rgba(224,92,92,0.2)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            -{daysDiff(t.due_date)} dní
                          </span>
                        </div>
                      ))
                    )
                  ) : overduePayments.length === 0 ? (
                    <div
                      style={{
                        padding: 24,
                        textAlign: "center",
                        color: "rgba(255,255,255,0.25)",
                        fontSize: 13,
                      }}
                    >
                      ✓ Žádné zpožděné platby
                    </div>
                  ) : (
                    overduePayments.map((p, i) => (
                      <div
                        key={p.id}
                        style={{
                          padding: "12px 22px",
                          borderBottom:
                            i < overduePayments.length - 1
                              ? "1px solid rgba(255,255,255,0.04)"
                              : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              marginBottom: 3,
                            }}
                          >
                            {p.type === "deposit"
                              ? "Záloha č.1"
                              : p.type === "prepay"
                                ? "Záloha č.2"
                                : "Vyúčtování"}{" "}
                            — {fmtMoney(p.amount)}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.35)",
                            }}
                          >
                            {p.events?.title}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: "monospace",
                            padding: "3px 8px",
                            borderRadius: 20,
                            background: "rgba(240,136,77,0.12)",
                            color: "#f0884d",
                            border: "1px solid rgba(240,136,77,0.2)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          -{daysDiff(p.due_date)} dní
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Lead pipeline */}
              <div
                style={{
                  background: "#13131a",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "16px 22px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    Poptávky — pipeline
                  </span>
                  <a
                    href="/poptavky"
                    style={{
                      fontSize: 11,
                      color: "#c9a84c",
                      fontFamily: "monospace",
                      textDecoration: "none",
                    }}
                  >
                    Zobrazit vše →
                  </a>
                </div>
                {loading ? (
                  <div
                    style={{
                      padding: 22,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} h={18} />
                    ))}
                  </div>
                ) : leads.length === 0 ? (
                  <div
                    style={{
                      padding: 32,
                      textAlign: "center",
                      color: "rgba(255,255,255,0.25)",
                      fontSize: 13,
                    }}
                  >
                    Žádné otevřené poptávky
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Jméno", "Typ", "Zdroj", "Status", "Datum"].map(
                          (h) => (
                            <th
                              key={h}
                              style={{
                                textAlign: "left",
                                padding: "10px 22px",
                                fontSize: 10,
                                fontFamily: "monospace",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: "rgba(255,255,255,0.25)",
                                fontWeight: 400,
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.04)",
                              }}
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((l, i) => (
                        <tr
                          key={l.id}
                          style={{
                            borderBottom:
                              i < leads.length - 1
                                ? "1px solid rgba(255,255,255,0.04)"
                                : "none",
                            cursor: "pointer",
                          }}
                          onClick={() => router.push(`/poptavky/${l.id}`)}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(255,255,255,0.02)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td
                            style={{
                              padding: "12px 22px",
                              fontWeight: 500,
                              fontSize: 13,
                            }}
                          >
                            {l.name}
                          </td>
                          <td style={{ padding: "12px 22px", fontSize: 12 }}>
                            {typeIcon(l.event_type || "")} {l.event_type}
                          </td>
                          <td
                            style={{
                              padding: "12px 22px",
                              fontSize: 11,
                              color: "rgba(255,255,255,0.45)",
                              fontFamily: "monospace",
                            }}
                          >
                            {sourceLabel(l.source || "")}
                          </td>
                          <td style={{ padding: "12px 22px" }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: "monospace",
                                padding: "3px 8px",
                                borderRadius: 20,
                                fontWeight: 600,
                                background: "rgba(167,139,250,0.1)",
                                color: "#a78bfa",
                                border: "1px solid rgba(167,139,250,0.2)",
                              }}
                            >
                              {leadStatusLabel(l.status)}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 22px",
                              fontSize: 11,
                              color: "rgba(255,255,255,0.35)",
                              fontFamily: "monospace",
                            }}
                          >
                            {new Date(l.created_at).toLocaleDateString(
                              "cs-CZ",
                              {
                                day: "numeric",
                                month: "numeric",
                                year: "2-digit",
                              },
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Calendar */}
              <div
                style={{
                  background: "#13131a",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "18px 20px",
                }}
              >
                <MiniCalendar events={upcomingEvents} />
              </div>

              {/* Quick actions */}
              <div
                style={{
                  background: "#13131a",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "18px 20px",
                }}
              >
                <p
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "monospace",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 14,
                  }}
                >
                  Rychlé akce
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {[
                    {
                      label: "＋ Nová poptávka",
                      href: "/poptavky/nova",
                      primary: false,
                    },
                    {
                      label: "＋ Nová akce",
                      href: "/akce/nova",
                      primary: true,
                    },
                    {
                      label: "＋ Zaznamenat hovor",
                      href: "/komunikace/nova",
                      primary: false,
                    },
                    {
                      label: "＋ Přidat úkol",
                      href: "/ukoly/novy",
                      primary: false,
                    },
                  ].map((a) => (
                    <a
                      key={a.label}
                      href={a.href}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 7,
                        border: a.primary
                          ? "none"
                          : "1px solid rgba(255,255,255,0.08)",
                        background: a.primary
                          ? "#c9a84c"
                          : "rgba(255,255,255,0.03)",
                        color: a.primary ? "#0c0c0f" : "rgba(255,255,255,0.6)",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: a.primary ? 700 : 400,
                        textDecoration: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      {a.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
