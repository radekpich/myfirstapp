"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Event = {
  id: string;
  title: string;
  event_type: string | null;
  date_from: string | null;
  date_to: string | null;
  guests_adults: number;
  guests_kids: number;
  guests_kids_u5: number;
  status: string;
  discount_amount: number;
  created_at: string;
  clients: { name: string } | null;
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ALL_STATUSES = [
  { value: "lead", label: "Poptávka", color: "#6b7280" },
  { value: "offer_sent", label: "Nabídka odeslána", color: "#a78bfa" },
  { value: "meeting_planned", label: "Schůzka naplánována", color: "#60a5fa" },
  { value: "meeting_done", label: "Schůzka proběhla", color: "#34d399" },
  { value: "deposit_pending", label: "Čeká na zálohu", color: "#f59e0b" },
  { value: "reserved", label: "Rezervováno", color: "#10b981" },
  { value: "planning", label: "Plánování", color: "#3b82f6" },
  { value: "prepay_pending", label: "Záloha č.2", color: "#f97316" },
  { value: "ready", label: "Připraveno", color: "#22c55e" },
  { value: "in_progress", label: "Probíhá", color: "#06b6d4" },
  { value: "settlement_pending", label: "Vyúčtování", color: "#f43f5e" },
  { value: "completed", label: "Dokončeno", color: "#4ade80" },
  { value: "cancelled", label: "Zrušeno", color: "#ef4444" },
];

const EVENT_TYPES = [
  { value: "wedding", label: "Svatba", icon: "💍" },
  { value: "teambuilding", label: "Teambuilding", icon: "🏆" },
  { value: "party", label: "Párty", icon: "🎉" },
  { value: "accommodation", label: "Ubytování", icon: "🛏️" },
  { value: "corporate", label: "Firemní akce", icon: "🏢" },
  { value: "other", label: "Jiné", icon: "📅" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function statusInfo(s: string) {
  return (
    ALL_STATUSES.find((x) => x.value === s) || { label: s, color: "#6b7280" }
  );
}

function typeInfo(t: string | null) {
  return (
    EVENT_TYPES.find((x) => x.value === t) || { label: t || "—", icon: "📅" }
  );
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(d: string | null) {
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / 86400000);
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AkcePage() {
  const router = useRouter();
  const supabase = createClient();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [view, setView] = useState<"list" | "grid">("list");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();
      if (!profile) return;

      setCompanyId(profile.company_id);

      const { data } = await supabase
        .from("events")
        .select(
          "id, title, event_type, date_from, date_to, guests_adults, guests_kids, guests_kids_u5, status, discount_amount, created_at, clients(name)",
        )
        .eq("company_id", profile.company_id)
        .order("date_from", { ascending: true });

      setEvents((data as unknown as Event[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  // Filter
  const filtered = events.filter((ev) => {
    const matchSearch =
      !search ||
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      (ev.clients?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || ev.status === filterStatus;
    const matchType = filterType === "all" || ev.event_type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  // Group by status for quick counts
  const counts = ALL_STATUSES.reduce(
    (acc, s) => {
      acc[s.value] = events.filter((e) => e.status === s.value).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; }
        a { text-decoration: none; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#0c0c0f",
          color: "rgba(255,255,255,0.82)",
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          fontSize: 14,
          display: "flex",
        }}
      >
        {/* SIDEBAR */}
        <Sidebar active="akce" />

        {/* MAIN */}
        <div style={{ flex: 1, marginLeft: 220, padding: "32px 32px 48px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 28,
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
                Akce
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.35)",
                  margin: "4px 0 0",
                  fontSize: 13,
                }}
              >
                {loading
                  ? "Načítám..."
                  : `${events.length} akcí celkem · ${filtered.length} zobrazeno`}
              </p>
            </div>
            <button
              onClick={() => router.push("/akce/nova")}
              style={{
                background: "#c9a84c",
                border: "none",
                color: "#0c0c0f",
                padding: "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ＋ Nová akce
            </button>
          </div>

          {/* Status pills */}
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <button
              onClick={() => setFilterStatus("all")}
              style={{ ...pillStyle(filterStatus === "all") }}
            >
              Vše ({events.length})
            </button>
            {ALL_STATUSES.filter((s) => counts[s.value] > 0).map((s) => (
              <button
                key={s.value}
                onClick={() =>
                  setFilterStatus(filterStatus === s.value ? "all" : s.value)
                }
                style={{ ...pillStyle(filterStatus === s.value, s.color) }}
              >
                {s.label} ({counts[s.value]})
              </button>
            ))}
          </div>

          {/* Search + type filter */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat akci nebo klienta..."
              style={{
                flex: 1,
                padding: "9px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: "9px 14px",
                background: "#13131a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">Všechny typy</option>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
            <div
              style={{
                display: "flex",
                background: "#13131a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {(["list", "grid"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: "9px 14px",
                    background:
                      view === v ? "rgba(201,168,76,0.15)" : "transparent",
                    border: "none",
                    color: view === v ? "#c9a84c" : "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {v === "list" ? "☰" : "⊞"}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    background: "#13131a",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10,
                    padding: 20,
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <Skeleton h={20} w="30%" />
                  <Skeleton h={16} w="15%" />
                  <Skeleton h={16} w="10%" />
                  <Skeleton h={20} w="12%" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 0",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
              <div style={{ fontSize: 16, marginBottom: 8 }}>
                Žádné akce nenalezeny
              </div>
              <div style={{ fontSize: 13 }}>
                Zkuste změnit filtr nebo vytvořte novou akci
              </div>
            </div>
          ) : view === "list" ? (
            <EventTable
              events={filtered}
              onRowClick={(id) => router.push(`/akce/${id}`)}
            />
          ) : (
            <EventGrid
              events={filtered}
              onCardClick={(id) => router.push(`/akce/${id}`)}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ─── TABLE VIEW ───────────────────────────────────────────────────────────────

function EventTable({
  events,
  onRowClick,
}: {
  events: Event[];
  onRowClick: (id: string) => void;
}) {
  return (
    <div
      style={{
        background: "#13131a",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Akce", "Klient", "Datum", "Hosté", "Status", "Dní do akce"].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "11px 20px",
                    fontSize: 10,
                    fontFamily: "monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.25)",
                    fontWeight: 400,
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {events.map((ev, i) => {
            const si = statusInfo(ev.status);
            const ti = typeInfo(ev.event_type);
            const days = daysUntil(ev.date_from);
            return (
              <tr
                key={ev.id}
                onClick={() => onRowClick(ev.id)}
                style={{
                  borderBottom:
                    i < events.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.025)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td style={{ padding: "14px 20px" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span style={{ fontSize: 18 }}>{ti.icon}</span>
                    <div>
                      <div
                        style={{ fontWeight: 500, fontSize: 13, color: "#fff" }}
                      >
                        {ev.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.3)",
                          marginTop: 2,
                        }}
                      >
                        {ti.label}
                      </div>
                    </div>
                  </div>
                </td>
                <td
                  style={{
                    padding: "14px 20px",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  {ev.clients?.name || "—"}
                </td>
                <td
                  style={{
                    padding: "14px 20px",
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: "rgba(255,255,255,0.5)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtDate(ev.date_from)}
                  {ev.date_to && ev.date_to !== ev.date_from && (
                    <>
                      <br />
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>
                        → {fmtDate(ev.date_to)}
                      </span>
                    </>
                  )}
                </td>
                <td
                  style={{
                    padding: "14px 20px",
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {ev.guests_adults + ev.guests_kids} os.
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "monospace",
                      padding: "3px 9px",
                      borderRadius: 20,
                      fontWeight: 600,
                      background: `${si.color}18`,
                      color: si.color,
                      border: `1px solid ${si.color}35`,
                    }}
                  >
                    {si.label}
                  </span>
                </td>
                <td
                  style={{
                    padding: "14px 20px",
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                >
                  {days === null ? (
                    "—"
                  ) : days < 0 ? (
                    <span style={{ color: "#e05c5c" }}>
                      {Math.abs(days)} dní zpět
                    </span>
                  ) : days === 0 ? (
                    <span style={{ color: "#c9a84c", fontWeight: 700 }}>
                      DNES
                    </span>
                  ) : days <= 14 ? (
                    <span style={{ color: "#f0884d" }}>za {days} dní</span>
                  ) : (
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>
                      za {days} dní
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── GRID VIEW ────────────────────────────────────────────────────────────────

function EventGrid({
  events,
  onCardClick,
}: {
  events: Event[];
  onCardClick: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 14,
      }}
    >
      {events.map((ev) => {
        const si = statusInfo(ev.status);
        const ti = typeInfo(ev.event_type);
        const days = daysUntil(ev.date_from);
        return (
          <div
            key={ev.id}
            onClick={() => onCardClick(ev.id)}
            style={{
              background: "#13131a",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10,
              padding: 20,
              cursor: "pointer",
              borderTop: `3px solid ${si.color}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a24")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#13131a")}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 28 }}>{ti.icon}</span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  padding: "3px 9px",
                  borderRadius: 20,
                  fontWeight: 600,
                  background: `${si.color}18`,
                  color: si.color,
                  border: `1px solid ${si.color}35`,
                }}
              >
                {si.label}
              </span>
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: "#fff",
                marginBottom: 4,
              }}
            >
              {ev.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                marginBottom: 14,
              }}
            >
              {ev.clients?.name || "—"}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                fontFamily: "monospace",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              <span>{fmtDate(ev.date_from)}</span>
              <span>{ev.guests_adults + ev.guests_kids} os.</span>
              {days !== null && (
                <span
                  style={{
                    color:
                      days <= 14 && days >= 0
                        ? "#f0884d"
                        : "rgba(255,255,255,0.4)",
                  }}
                >
                  {days === 0
                    ? "DNES"
                    : days < 0
                      ? `${Math.abs(days)}d zpět`
                      : `za ${days}d`}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PILL STYLE ───────────────────────────────────────────────────────────────

function pillStyle(active: boolean, color = "#c9a84c"): React.CSSProperties {
  return {
    padding: "5px 12px",
    borderRadius: 20,
    border: "none",
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: active ? 600 : 400,
    background: active ? `${color}20` : "rgba(255,255,255,0.04)",
    color: active ? color : "rgba(255,255,255,0.4)",
    outline: active ? `1px solid ${color}40` : "none",
    transition: "all 0.12s",
  };
}

// ─── SIDEBAR (shared) ─────────────────────────────────────────────────────────

export function Sidebar({ active }: { active: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = useState("...");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()
          .then(({ data }) =>
            setUserName(data?.full_name || user.email || "Uživatel"),
          );
      }
    });
  }, []);

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
            marginBottom: 10,
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
          onClick={async () => {
            await createClient().auth.signOut();
            window.location.href = "/login";
          }}
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
  );
}
