"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};
type Lead = {
  id: string;
  name: string;
  event_type: string | null;
  preferred_date: string | null;
  guest_count_estimate: number;
};
type Template = {
  id: string;
  name: string;
  default_task_list: {
    title: string;
    due_days_before: number;
    assigned_role: string;
  }[];
};

type FormData = {
  // Basic
  title: string;
  event_type: string;
  varianta_akce: string;
  // Dates
  date_from: string;
  date_to: string;
  // Guests
  guests_adults: number;
  guests_kids: number;
  guests_kids_u5: number;
  // Relations
  client_id: string;
  template_id: string;
  lead_id: string;
  // Notes
  internal_notes: string;
  meeting_notes: string;
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { value: "wedding", label: "Svatba", icon: "💍" },
  { value: "teambuilding", label: "Teambuilding", icon: "🏆" },
  { value: "party", label: "Párty", icon: "🎉" },
  { value: "accommodation", label: "Ubytování", icon: "🛏️" },
  { value: "corporate", label: "Firemní akce", icon: "🏢" },
  { value: "other", label: "Jiné", icon: "📅" },
];

const VARIANTS = ["Pronájem", "Vlastní catering", "Pouze ubytování"];

const EMPTY: FormData = {
  title: "",
  event_type: "",
  varianta_akce: "",
  date_from: "",
  date_to: "",
  guests_adults: 0,
  guests_kids: 0,
  guests_kids_u5: 0,
  client_id: "",
  template_id: "",
  lead_id: "",
  internal_notes: "",
  meeting_notes: "",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function nightCount(from: string, to: string) {
  if (!from || !to) return 0;
  return Math.max(
    0,
    Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86400000),
  );
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── STEP COMPONENTS ──────────────────────────────────────────────────────────

function StepIndicator({
  current,
  steps,
}: {
  current: number;
  steps: string[];
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: 32,
      }}
    >
      {steps.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            flex: i < steps.length - 1 ? 1 : 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background:
                  i < current
                    ? "#4caf7d"
                    : i === current
                      ? "#c9a84c"
                      : "rgba(255,255,255,0.06)",
                border:
                  i === current
                    ? "2px solid #c9a84c"
                    : i < current
                      ? "none"
                      : "1px solid rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color:
                  i < current
                    ? "#0c0c0f"
                    : i === current
                      ? "#0c0c0f"
                      : "rgba(255,255,255,0.3)",
              }}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              style={{
                fontSize: 12,
                color:
                  i === current
                    ? "#fff"
                    : i < current
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(255,255,255,0.25)",
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 1,
                background:
                  i < current
                    ? "rgba(76,175,125,0.3)"
                    : "rgba(255,255,255,0.06)",
                margin: "0 14px",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontFamily: "monospace",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.35)",
        marginBottom: 7,
      }}
    >
      {children}
    </div>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Label>
        {label}
        {required && <span style={{ color: "#e05c5c" }}> *</span>}
      </Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          color: "#fff",
          fontSize: 13,
          outline: "none",
          fontFamily: "inherit",
          transition: "border-color 0.15s",
          boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.5)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function NovaAkcePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New client inline form
  const [newClientMode, setNewClientMode] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const STEPS = [
    "Odkud?",
    "Základní info",
    "Datum & hosté",
    "Šablona & úkoly",
    "Shrnutí",
  ];

  const set = (key: keyof FormData) => (val: string | number) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // ── Load data ──────────────────────────────────────────────────────────────

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

      const cid = profile.company_id;
      setCompanyId(cid);

      const [clientsRes, leadsRes, templatesRes] = await Promise.all([
        supabase
          .from("clients")
          .select("id, name, email, phone")
          .eq("company_id", cid)
          .order("name"),
        supabase
          .from("leads")
          .select("id, name, event_type, preferred_date, guest_count_estimate")
          .eq("company_id", cid)
          .not("status", "in", '("converted","lost")')
          .order("created_at", { ascending: false }),
        supabase
          .from("event_templates")
          .select("id, name, default_task_list")
          .or(`is_global.eq.true,company_id.eq.${cid}`)
          .order("name"),
      ]);

      setClients(clientsRes.data || []);
      setLeads(leadsRes.data || []);
      setTemplates((templatesRes.data as Template[]) || []);

      // Pre-fill from URL params (e.g. ?lead_id=xxx or ?client_id=xxx)
      const leadId = searchParams.get("lead_id");
      const clientId = searchParams.get("client_id");

      if (leadId) {
        const lead = leadsRes.data?.find((l) => l.id === leadId);
        if (lead) {
          setForm((prev) => ({
            ...prev,
            lead_id: leadId,
            title: lead.name,
            event_type: lead.event_type || "",
            guests_adults: lead.guest_count_estimate || 0,
          }));
          setStep(1); // skip "odkud" step if coming from lead
        }
      } else if (clientId) {
        setForm((prev) => ({ ...prev, client_id: clientId }));
        setStep(1);
      }
    }
    load();
  }, []);

  // Update selected template when template_id changes
  useEffect(() => {
    const t = templates.find((t) => t.id === form.template_id) || null;
    setSelectedTemplate(t);
  }, [form.template_id, templates]);

  // ── Create new client inline ───────────────────────────────────────────────

  async function handleCreateClient() {
    if (!newClient.name.trim() || !companyId) return;
    const { data, error } = await supabase
      .from("clients")
      .insert({
        company_id: companyId,
        name: newClient.name,
        email: newClient.email || null,
        phone: newClient.phone || null,
      })
      .select("id, name, email, phone")
      .single();
    if (data) {
      setClients((prev) => [...prev, data]);
      setForm((prev) => ({ ...prev, client_id: data.id }));
      setNewClientMode(false);
      setNewClient({ name: "", email: "", phone: "" });
    }
    if (error) setError("Nepodařilo se vytvořit klienta: " + error.message);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!companyId) return;
    setSaving(true);
    setError(null);

    // 1. Create event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        company_id: companyId,
        client_id: form.client_id || null,
        template_id: form.template_id || null,
        title: form.title,
        event_type: form.event_type || null,
        varianta_akce: form.varianta_akce || null,
        date_from: form.date_from || null,
        date_to: form.date_to || null,
        guests_adults: form.guests_adults,
        guests_kids: form.guests_kids,
        guests_kids_u5: form.guests_kids_u5,
        status: "lead",
        discount_amount: 0,
        internal_notes: form.internal_notes || null,
        meeting_notes: form.meeting_notes || null,
      })
      .select("id")
      .single();

    if (eventError || !event) {
      setError("Nepodařilo se vytvořit akci: " + eventError?.message);
      setSaving(false);
      return;
    }

    // 2. Auto-generate tasks from template
    if (
      selectedTemplate &&
      form.date_from &&
      selectedTemplate.default_task_list?.length > 0
    ) {
      const taskRows = selectedTemplate.default_task_list.map((t) => ({
        company_id: companyId,
        event_id: event.id,
        title: t.title,
        due_days_before: t.due_days_before,
        due_date: addDays(form.date_from, -t.due_days_before),
        done: false,
      }));
      await supabase.from("tasks").insert(taskRows);
    }

    // 3. Update lead status to converted (if came from lead)
    if (form.lead_id) {
      await supabase
        .from("leads")
        .update({
          status: "converted",
          converted_at: new Date().toISOString(),
        })
        .eq("id", form.lead_id);
    }

    router.push(`/akce/${event.id}`);
  }

  // ── Validation per step ────────────────────────────────────────────────────

  function canProceed() {
    if (step === 0) return true; // source step — always can proceed
    if (step === 1) return form.title.trim().length > 0;
    if (step === 2) return form.date_from.length > 0;
    if (step === 3) return true;
    return true;
  }

  const nights = nightCount(form.date_from, form.date_to);
  const cityTax = (form.guests_adults + form.guests_kids) * nights * 40;

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        input, select, textarea { font-family: inherit; }
        input:focus, select:focus, textarea:focus { outline: none !important; border-color: rgba(201,168,76,0.5) !important; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.5; }
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
        <div
          style={{
            marginLeft: 220,
            padding: "32px 0 60px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "100%", maxWidth: 680, padding: "0 24px" }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
              <a
                href="/akce"
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.35)",
                  textDecoration: "none",
                }}
              >
                ← Akce
              </a>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#fff",
                  margin: "10px 0 4px",
                }}
              >
                Nová akce
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 13,
                  margin: 0,
                }}
              >
                Vyplňte základní informace pro novou akci
              </p>
            </div>

            {/* Step indicator */}
            <StepIndicator current={step} steps={STEPS} />

            {/* Card */}
            <div
              style={{
                background: "#13131a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "28px 32px",
              }}
            >
              {/* ── STEP 0: SOURCE ── */}
              {step === 0 && (
                <div>
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#fff",
                      margin: "0 0 6px",
                    }}
                  >
                    Odkud akce pochází?
                  </h2>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 13,
                      margin: "0 0 24px",
                    }}
                  >
                    Vyberte poptávku nebo vytvořte akci od začátku
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      marginBottom: 28,
                    }}
                  >
                    {/* From lead */}
                    <button
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          lead_id: prev.lead_id || " ",
                        }))
                      }
                      style={{
                        padding: "20px",
                        borderRadius: 10,
                        cursor: "pointer",
                        textAlign: "left",
                        background: form.lead_id
                          ? "rgba(201,168,76,0.08)"
                          : "rgba(255,255,255,0.03)",
                        border: `1px solid ${form.lead_id ? "rgba(201,168,76,0.35)" : "rgba(255,255,255,0.08)"}`,
                        color: "inherit",
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 10 }}>🌱</div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "#fff",
                          marginBottom: 4,
                        }}
                      >
                        Z poptávky
                      </div>
                      <div
                        style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}
                      >
                        Existující poptávka se konvertuje na akci
                      </div>
                    </button>

                    {/* From scratch */}
                    <button
                      onClick={() =>
                        setForm((prev) => ({ ...prev, lead_id: "" }))
                      }
                      style={{
                        padding: "20px",
                        borderRadius: 10,
                        cursor: "pointer",
                        textAlign: "left",
                        background:
                          form.lead_id === ""
                            ? "rgba(201,168,76,0.08)"
                            : "rgba(255,255,255,0.03)",
                        border: `1px solid ${form.lead_id === "" ? "rgba(201,168,76,0.35)" : "rgba(255,255,255,0.08)"}`,
                        color: "inherit",
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 10 }}>✨</div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "#fff",
                          marginBottom: 4,
                        }}
                      >
                        Od začátku
                      </div>
                      <div
                        style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}
                      >
                        Nový klient nebo existující bez poptávky
                      </div>
                    </button>
                  </div>

                  {/* Select lead */}
                  {form.lead_id && (
                    <div style={{ marginBottom: 8 }}>
                      <Label>Vyberte poptávku</Label>
                      <select
                        value={form.lead_id === " " ? "" : form.lead_id}
                        onChange={(e) => {
                          const lead = leads.find(
                            (l) => l.id === e.target.value,
                          );
                          if (lead) {
                            setForm((prev) => ({
                              ...prev,
                              lead_id: lead.id,
                              title: lead.name,
                              event_type: lead.event_type || "",
                              guests_adults: lead.guest_count_estimate || 0,
                            }));
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          background: "#0c0c0f",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 8,
                          color: "#fff",
                          fontSize: 13,
                        }}
                      >
                        <option value="">— vyberte poptávku —</option>
                        {leads.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                            {l.event_type ? ` — ${l.event_type}` : ""}
                            {l.preferred_date ? ` (${l.preferred_date})` : ""}
                          </option>
                        ))}
                      </select>
                      {leads.length === 0 && (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 12,
                            color: "rgba(255,255,255,0.3)",
                          }}
                        >
                          Žádné otevřené poptávky
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 1: BASIC INFO ── */}
              {step === 1 && (
                <div>
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#fff",
                      margin: "0 0 6px",
                    }}
                  >
                    Základní informace
                  </h2>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 13,
                      margin: "0 0 24px",
                    }}
                  >
                    Název akce, typ a klient
                  </p>

                  <InputField
                    label="Název akce"
                    value={form.title}
                    onChange={set("title")}
                    placeholder="Novákovi — Svatba"
                    required
                  />

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 14,
                    }}
                  >
                    {/* Event type */}
                    <div style={{ marginBottom: 16 }}>
                      <Label>
                        Typ akce <span style={{ color: "#e05c5c" }}>*</span>
                      </Label>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 6,
                        }}
                      >
                        {EVENT_TYPES.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => set("event_type")(t.value)}
                            style={{
                              padding: "10px 6px",
                              borderRadius: 8,
                              cursor: "pointer",
                              textAlign: "center",
                              background:
                                form.event_type === t.value
                                  ? "rgba(201,168,76,0.1)"
                                  : "rgba(255,255,255,0.03)",
                              border: `1px solid ${form.event_type === t.value ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)"}`,
                              color:
                                form.event_type === t.value
                                  ? "#c9a84c"
                                  : "rgba(255,255,255,0.5)",
                              fontSize: 11,
                            }}
                          >
                            <div style={{ fontSize: 18, marginBottom: 4 }}>
                              {t.icon}
                            </div>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Varianta */}
                    <div style={{ marginBottom: 16 }}>
                      <Label>Varianta</Label>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {VARIANTS.map((v) => (
                          <button
                            key={v}
                            onClick={() => set("varianta_akce")(v)}
                            style={{
                              padding: "9px 12px",
                              borderRadius: 8,
                              cursor: "pointer",
                              textAlign: "left",
                              background:
                                form.varianta_akce === v
                                  ? "rgba(201,168,76,0.08)"
                                  : "rgba(255,255,255,0.03)",
                              border: `1px solid ${form.varianta_akce === v ? "rgba(201,168,76,0.35)" : "rgba(255,255,255,0.07)"}`,
                              color:
                                form.varianta_akce === v
                                  ? "#c9a84c"
                                  : "rgba(255,255,255,0.55)",
                              fontSize: 12,
                            }}
                          >
                            {form.varianta_akce === v ? "◉" : "○"} {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Client */}
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 7,
                      }}
                    >
                      <Label>Klient</Label>
                      <button
                        onClick={() => setNewClientMode(!newClientMode)}
                        style={{
                          fontSize: 11,
                          color: "#c9a84c",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "monospace",
                        }}
                      >
                        {newClientMode
                          ? "← vybrat existujícího"
                          : "＋ nový klient"}
                      </button>
                    </div>

                    {!newClientMode ? (
                      <select
                        value={form.client_id}
                        onChange={(e) => set("client_id")(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          background: "#0c0c0f",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 8,
                          color: "#fff",
                          fontSize: 13,
                        }}
                      >
                        <option value="">— bez klienta —</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                            {c.phone ? ` · ${c.phone}` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 10,
                          padding: "16px",
                        }}
                      >
                        <InputField
                          label="Jméno"
                          value={newClient.name}
                          onChange={(v) =>
                            setNewClient((p) => ({ ...p, name: v }))
                          }
                          placeholder="Jana Nováková"
                          required
                        />
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                          }}
                        >
                          <InputField
                            label="Email"
                            type="email"
                            value={newClient.email}
                            onChange={(v) =>
                              setNewClient((p) => ({ ...p, email: v }))
                            }
                            placeholder="jana@email.cz"
                          />
                          <InputField
                            label="Telefon"
                            value={newClient.phone}
                            onChange={(v) =>
                              setNewClient((p) => ({ ...p, phone: v }))
                            }
                            placeholder="+420 777 123 456"
                          />
                        </div>
                        <button
                          onClick={handleCreateClient}
                          disabled={!newClient.name.trim()}
                          style={{
                            padding: "9px 18px",
                            background: newClient.name.trim()
                              ? "#c9a84c"
                              : "rgba(201,168,76,0.3)",
                            border: "none",
                            borderRadius: 7,
                            color: "#0c0c0f",
                            fontWeight: 700,
                            cursor: newClient.name.trim()
                              ? "pointer"
                              : "not-allowed",
                            fontSize: 12,
                          }}
                        >
                          Vytvořit klienta
                        </button>
                      </div>
                    )}

                    {/* Show selected client info */}
                    {form.client_id &&
                      !newClientMode &&
                      (() => {
                        const c = clients.find((x) => x.id === form.client_id);
                        return c ? (
                          <div
                            style={{
                              marginTop: 8,
                              padding: "8px 12px",
                              background: "rgba(76,175,125,0.06)",
                              border: "1px solid rgba(76,175,125,0.15)",
                              borderRadius: 7,
                              fontSize: 12,
                              color: "rgba(255,255,255,0.5)",
                            }}
                          >
                            ✓ {c.name}
                            {c.email ? ` · ${c.email}` : ""}
                            {c.phone ? ` · ${c.phone}` : ""}
                          </div>
                        ) : null;
                      })()}
                  </div>
                </div>
              )}

              {/* ── STEP 2: DATES & GUESTS ── */}
              {step === 2 && (
                <div>
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#fff",
                      margin: "0 0 6px",
                    }}
                  >
                    Datum a hosté
                  </h2>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 13,
                      margin: "0 0 24px",
                    }}
                  >
                    Kdy a kolik lidí
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 14,
                    }}
                  >
                    <InputField
                      label="Datum od"
                      type="date"
                      value={form.date_from}
                      onChange={(v) => {
                        set("date_from")(v);
                        if (!form.date_to) set("date_to")(v);
                      }}
                      required
                    />
                    <InputField
                      label="Datum do"
                      type="date"
                      value={form.date_to}
                      onChange={set("date_to")}
                    />
                  </div>

                  {/* Duration info */}
                  {form.date_from && form.date_to && (
                    <div
                      style={{
                        marginBottom: 20,
                        padding: "10px 14px",
                        background: "rgba(201,168,76,0.06)",
                        border: "1px solid rgba(201,168,76,0.15)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "rgba(255,255,255,0.5)",
                        fontFamily: "monospace",
                      }}
                    >
                      {nights === 0
                        ? "1 den (bez ubytování)"
                        : `${nights + 1} dní · ${nights} nocí`}
                    </div>
                  )}

                  {/* Guests */}
                  <div style={{ marginBottom: 16 }}>
                    <Label>Počty hostů</Label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 12,
                      }}
                    >
                      {[
                        {
                          key: "guests_adults" as const,
                          label: "Dospělí",
                          hint: "platí city tax + catering",
                        },
                        {
                          key: "guests_kids" as const,
                          label: "Děti (u stolu)",
                          hint: "platí city tax",
                        },
                        {
                          key: "guests_kids_u5" as const,
                          label: "Děti do 5 let",
                          hint: "nezapočítávají se",
                        },
                      ].map((g) => (
                        <div
                          key={g.key}
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 8,
                            padding: "14px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              fontFamily: "monospace",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              color: "rgba(255,255,255,0.35)",
                              marginBottom: 10,
                            }}
                          >
                            {g.label}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <button
                              onClick={() =>
                                set(g.key)(Math.max(0, form[g.key] - 1))
                              }
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: 16,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              −
                            </button>
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontSize: 20,
                                fontWeight: 700,
                                color: "#fff",
                                minWidth: 30,
                                textAlign: "center",
                              }}
                            >
                              {form[g.key]}
                            </span>
                            <button
                              onClick={() => set(g.key)(form[g.key] + 1)}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: 16,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              ＋
                            </button>
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.2)",
                              marginTop: 8,
                            }}
                          >
                            {g.hint}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* City tax preview */}
                  {nights > 0 && form.guests_adults + form.guests_kids > 0 && (
                    <div
                      style={{
                        padding: "12px 16px",
                        background: "rgba(201,168,76,0.05)",
                        border: "1px solid rgba(201,168,76,0.12)",
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>
                        Poplatek městu:{" "}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>
                        ({form.guests_adults} + {form.guests_kids}) × {nights}{" "}
                        nocí × 40 Kč ={" "}
                      </span>
                      <strong
                        style={{ color: "#c9a84c", fontFamily: "monospace" }}
                      >
                        {cityTax.toLocaleString("cs-CZ")} Kč
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 3: TEMPLATE ── */}
              {step === 3 && (
                <div>
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#fff",
                      margin: "0 0 6px",
                    }}
                  >
                    Šablona a úkoly
                  </h2>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 13,
                      margin: "0 0 24px",
                    }}
                  >
                    Vyberte šablonu — automaticky se vygenerují úkoly
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      marginBottom: 20,
                    }}
                  >
                    {/* No template */}
                    <button
                      onClick={() =>
                        setForm((prev) => ({ ...prev, template_id: "" }))
                      }
                      style={{
                        padding: "14px 18px",
                        borderRadius: 10,
                        cursor: "pointer",
                        textAlign: "left",
                        background:
                          form.template_id === ""
                            ? "rgba(201,168,76,0.08)"
                            : "rgba(255,255,255,0.02)",
                        border: `1px solid ${form.template_id === "" ? "rgba(201,168,76,0.35)" : "rgba(255,255,255,0.07)"}`,
                        color:
                          form.template_id === ""
                            ? "#c9a84c"
                            : "rgba(255,255,255,0.5)",
                      }}
                    >
                      <div style={{ fontWeight: 500, fontSize: 13 }}>
                        {form.template_id === "" ? "◉" : "○"} Bez šablony
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.3)",
                          marginTop: 3,
                        }}
                      >
                        Úkoly přidám ručně
                      </div>
                    </button>

                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() =>
                          setForm((prev) => ({ ...prev, template_id: t.id }))
                        }
                        style={{
                          padding: "14px 18px",
                          borderRadius: 10,
                          cursor: "pointer",
                          textAlign: "left",
                          background:
                            form.template_id === t.id
                              ? "rgba(201,168,76,0.08)"
                              : "rgba(255,255,255,0.02)",
                          border: `1px solid ${form.template_id === t.id ? "rgba(201,168,76,0.35)" : "rgba(255,255,255,0.07)"}`,
                          color: "inherit",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: 13,
                              color:
                                form.template_id === t.id ? "#c9a84c" : "#fff",
                            }}
                          >
                            {form.template_id === t.id ? "◉" : "○"} {t.name}
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "monospace",
                              color: "rgba(255,255,255,0.3)",
                            }}
                          >
                            {t.default_task_list?.length || 0} úkolů
                          </span>
                        </div>
                        {form.template_id === t.id &&
                          t.default_task_list?.length > 0 && (
                            <div
                              style={{
                                marginTop: 12,
                                paddingTop: 12,
                                borderTop: "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 10,
                                  fontFamily: "monospace",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.1em",
                                  color: "rgba(255,255,255,0.25)",
                                  marginBottom: 8,
                                }}
                              >
                                Vygenerované úkoly:
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 4,
                                }}
                              >
                                {t.default_task_list
                                  .slice(0, 6)
                                  .map((task, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        display: "flex",
                                        gap: 10,
                                        fontSize: 12,
                                        color: "rgba(255,255,255,0.5)",
                                        alignItems: "center",
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: "#4caf7d",
                                          flexShrink: 0,
                                        }}
                                      >
                                        ○
                                      </span>
                                      <span style={{ flex: 1 }}>
                                        {task.title}
                                      </span>
                                      <span
                                        style={{
                                          fontFamily: "monospace",
                                          fontSize: 10,
                                          color: "rgba(255,255,255,0.25)",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {task.due_days_before >= 0
                                          ? `${task.due_days_before}d před`
                                          : `${Math.abs(task.due_days_before)}d po`}
                                      </span>
                                    </div>
                                  ))}
                                {t.default_task_list.length > 6 && (
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: "rgba(255,255,255,0.25)",
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    + {t.default_task_list.length - 6} dalších
                                    úkolů
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                      </button>
                    ))}
                  </div>

                  {!form.date_from && form.template_id && (
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "rgba(240,136,77,0.08)",
                        border: "1px solid rgba(240,136,77,0.2)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "#f0884d",
                      }}
                    >
                      ⚠ Nastavte datum akce (krok 3) aby se úkolům automaticky
                      vypočítaly termíny
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 4: SUMMARY ── */}
              {step === 4 && (
                <div>
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#fff",
                      margin: "0 0 6px",
                    }}
                  >
                    Shrnutí
                  </h2>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: 13,
                      margin: "0 0 24px",
                    }}
                  >
                    Zkontrolujte a potvrďte
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {[
                      { label: "Název", value: form.title },
                      {
                        label: "Typ",
                        value:
                          [
                            EVENT_TYPES.find((t) => t.value === form.event_type)
                              ?.icon,
                            EVENT_TYPES.find((t) => t.value === form.event_type)
                              ?.label,
                          ]
                            .filter(Boolean)
                            .join(" ") || "—",
                      },
                      { label: "Varianta", value: form.varianta_akce || "—" },
                      {
                        label: "Klient",
                        value:
                          clients.find((c) => c.id === form.client_id)?.name ||
                          "—",
                      },
                      { label: "Datum od", value: form.date_from || "—" },
                      { label: "Datum do", value: form.date_to || "—" },
                      { label: "Dospělí", value: String(form.guests_adults) },
                      { label: "Děti", value: String(form.guests_kids) },
                      {
                        label: "Šablona",
                        value:
                          templates.find((t) => t.id === form.template_id)
                            ?.name || "Bez šablony",
                      },
                      {
                        label: "Úkolů",
                        value: selectedTemplate
                          ? String(
                              selectedTemplate.default_task_list?.length || 0,
                            ) + " (automaticky)"
                          : "0",
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "10px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.35)",
                            fontFamily: "monospace",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {row.label}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: "#fff",
                            fontWeight: 500,
                          }}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {nights > 0 && cityTax > 0 && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: "10px 14px",
                        background: "rgba(201,168,76,0.06)",
                        border: "1px solid rgba(201,168,76,0.12)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      Poplatek městu:{" "}
                      <strong style={{ color: "#c9a84c" }}>
                        {cityTax.toLocaleString("cs-CZ")} Kč
                      </strong>
                    </div>
                  )}

                  {error && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: "10px 14px",
                        background: "rgba(224,92,92,0.1)",
                        border: "1px solid rgba(224,92,92,0.2)",
                        borderRadius: 8,
                        fontSize: 13,
                        color: "#e05c5c",
                      }}
                    >
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 20,
              }}
            >
              <button
                onClick={() =>
                  step > 0 ? setStep((s) => s - 1) : router.push("/akce")
                }
                style={{
                  padding: "10px 20px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {step === 0 ? "← Zrušit" : "← Zpět"}
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  style={{
                    padding: "10px 24px",
                    background: canProceed()
                      ? "#c9a84c"
                      : "rgba(201,168,76,0.3)",
                    border: "none",
                    borderRadius: 8,
                    color: "#0c0c0f",
                    cursor: canProceed() ? "pointer" : "not-allowed",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Pokračovat →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={saving || !form.title.trim()}
                  style={{
                    padding: "10px 28px",
                    background: saving ? "rgba(201,168,76,0.5)" : "#c9a84c",
                    border: "none",
                    borderRadius: 8,
                    color: "#0c0c0f",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {saving ? "Vytvářím..." : "✓ Vytvořit akci"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

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
