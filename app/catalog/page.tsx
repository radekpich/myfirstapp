"use client";

import { useEffect, useRef, useState, useCallback } from "react";


// ── Logo SVG ────────────────────────────────────────────────────────────────
function LogoMark({ size = 38 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 38 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M19 2 L36 19 L19 36 L2 19 Z"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="1"
      />
      <path
        d="M19 8 L30 19 L19 30 L8 19 Z"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="0.5"
        opacity="0.4"
      />
      <circle cx="19" cy="19" r="2" fill="#C9A84C" />
      <line x1="19" y1="6" x2="19" y2="10" stroke="#C9A84C" strokeWidth="1.5" />
      <line
        x1="19"
        y1="28"
        x2="19"
        y2="32"
        stroke="#C9A84C"
        strokeWidth="1.5"
      />
      <line x1="6" y1="19" x2="10" y2="19" stroke="#C9A84C" strokeWidth="1.5" />
      <line
        x1="28"
        y1="19"
        x2="32"
        y2="19"
        stroke="#C9A84C"
        strokeWidth="1.5"
      />
      <line
        x1="12"
        y1="12"
        x2="14.5"
        y2="14.5"
        stroke="#C9A84C"
        strokeWidth="0.8"
        opacity="0.6"
      />
      <line
        x1="26"
        y1="12"
        x2="23.5"
        y2="14.5"
        stroke="#C9A84C"
        strokeWidth="0.8"
        opacity="0.6"
      />
      <line
        x1="12"
        y1="26"
        x2="14.5"
        y2="23.5"
        stroke="#C9A84C"
        strokeWidth="0.8"
        opacity="0.6"
      />
      <line
        x1="26"
        y1="26"
        x2="23.5"
        y2="23.5"
        stroke="#C9A84C"
        strokeWidth="0.8"
        opacity="0.6"
      />
    </svg>
  );
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <a
      href="#"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        textDecoration: "none",
      }}
    >
      <LogoMark size={small ? 28 : 38} />
      <span
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: small ? 16 : 22,
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: "var(--ev-text)",
        }}
      >
        Ev<span style={{ color: "var(--ev-gold)" }}>av</span>io
      </span>
    </a>
  );
}

// ── Custom Cursor ────────────────────────────────────────────────────────────
function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mx = useRef(0);
  const my = useRef(0);
  const rx = useRef(0);
  const ry = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.current = e.clientX;
      my.current = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + "px";
        cursorRef.current.style.top = e.clientY + "px";
      }
    };
    window.addEventListener("mousemove", onMove);

    const animate = () => {
      rx.current += (mx.current - rx.current) * 0.12;
      ry.current += (my.current - ry.current) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = rx.current + "px";
        ringRef.current.style.top = ry.current + "px";
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="ev-cursor" />
      <div ref={ringRef} className="ev-cursor-ring" />
    </>
  );
}

// ── Scroll Reveal Hook ───────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Counter ──────────────────────────────────────────────────────────────────
function AnimatedCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1600;
          let startTime: number | null = null;
          const step = (ts: number) => {
            if (!startTime) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(ease * target));
            if (progress < 1) requestAnimationFrame(step);
            else setValue(target);
          };
          requestAnimationFrame(step);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

// ── Ticker ───────────────────────────────────────────────────────────────────
const tickerItems = [
  "Kalkulátor nabídek",
  "Správa rezervací",
  "Správa úkolů",
  "Klientský portál",
  "Týmová spolupráce",
  "Analytika & reporty",
  "PDF export",
  "Sledování plateb",
];

function Ticker() {
  const doubled = [...tickerItems, ...tickerItems];
  return (
    <div className="ev-ticker-wrap">
      <div className="ev-ticker">
        {doubled.map((item, i) => (
          <span key={i} className="ev-ticker-item">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Demo Calculator ───────────────────────────────────────────────────────────
const DEMO_ROWS = [
  { id: "r1", label: "Pronájem Srub", value: 38500 },
  { id: "r2", label: "Ubytování — Stáje (24 nocí)", value: 12000 },
  { id: "r3", label: "Catering — Raut (70 os.)", value: 8400 },
  { id: "r4", label: "Wellness & Infrasauna", value: 5600 },
  { id: "r5", label: "Výzdoba — Slavobrána", value: 3200 },
  { id: "r6", label: "Nápoje — balíček", value: 2800 },
];

function DemoCalculator() {
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(DEMO_ROWS.map((r) => [r.id, true])),
  );
  const [displayTotal, setDisplayTotal] = useState(70500);
  const animRef = useRef<number>(0);
  const ref = useRef<HTMLDivElement>(null);
  const [rowsVisible, setRowsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRowsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const calcTotal = useCallback(
    (state: Record<string, boolean>) =>
      DEMO_ROWS.reduce((sum, r) => sum + (state[r.id] ? r.value : 0), 0),
    [],
  );

  const animateTotal = useCallback((from: number, to: number) => {
    cancelAnimationFrame(animRef.current);
    const duration = 500;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayTotal(Math.round(from + (to - from) * ease));
      if (progress < 1) animRef.current = requestAnimationFrame(step);
      else setDisplayTotal(to);
    };
    animRef.current = requestAnimationFrame(step);
  }, []);

  const toggle = (id: string) => {
    const prev = calcTotal(active);
    const next = { ...active, [id]: !active[id] };
    setActive(next);
    animateTotal(prev, calcTotal(next));
  };

  const fmt = (n: number) => n.toLocaleString("cs-CZ") + " Kč";

  return (
    <div className="ev-demo-ui" ref={ref}>
      <div className="ev-demo-header">
        <span className="ev-demo-title-bar">Novákovi — Svatba 7.6.2026</span>
        <span className="ev-demo-status">● Aktivní</span>
      </div>
      <div className="ev-demo-body">
        {DEMO_ROWS.map((row, i) => (
          <div
            key={row.id}
            className="ev-demo-row"
            style={{
              opacity: rowsVisible ? 1 : 0,
              transform: rowsVisible ? "translateX(0)" : "translateX(-12px)",
              transition: `opacity 0.4s ease ${i * 100}ms, transform 0.4s ease ${i * 100}ms`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                onClick={() => toggle(row.id)}
                className={`ev-toggle ${active[row.id] ? "on" : ""}`}
                aria-label={`Toggle ${row.label}`}
              />
              <span className="ev-demo-row-name">{row.label}</span>
            </div>
            <span
              className="ev-demo-row-price"
              style={{ opacity: active[row.id] ? 1 : 0.3 }}
            >
              {fmt(row.value)}
            </span>
          </div>
        ))}
        <div className="ev-demo-total">
          <span className="ev-demo-total-label">Celkem</span>
          <span className="ev-demo-total-price">{fmt(displayTotal)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [activeType, setActiveType] = useState("Svatby");
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const eventTypes = [
    "Svatby",
    "Teambuildingyyy",
    "Firemní eventy",
    "Narozeninové oslavy",
    "Galavečery",
    "Konference",
    "Soukromé večeře",
    "Venkovní festivaly",
  ];

  const features = [
    {
      num: "01",
      icon: "◈",
      title: "Kalkulátor nabídek",
      desc: "Sestavte detailní nabídku za minuty. Hosté, prostory, catering, extras — okamžitý součet s exportem do PDF.",
    },
    {
      num: "02",
      icon: "◉",
      title: "Kalendář rezervací",
      desc: "Přehled všech eventů na jednom místě. Sledujte zálohy, doplatky a informace o klientech.",
    },
    {
      num: "03",
      icon: "◎",
      title: "Správa úkolů",
      desc: "Checklisty pro každý event. Přidělujte úkoly týmu, nastavujte termíny a nikdy na nic nezapomeňte.",
    },
    {
      num: "04",
      icon: "◐",
      title: "Klientský portál",
      desc: "Sdílejte detaily eventu a nabídky přímo s klienty. Profesionální a přizpůsobené vašemu branadu.",
    },
    {
      num: "05",
      icon: "◑",
      title: "Týmová spolupráce",
      desc: "Pozvěte personál, přidělte role a koordinujte celý tým z jednoho dashboardu.",
    },
    {
      num: "06",
      icon: "◒",
      title: "Analytika & reporty",
      desc: "Sledujte tržby, oblíbené služby a růst vašeho podnikání pomocí přehledných reportů.",
    },
  ];

  return (
    <>
      <CustomCursor />

      {/* NAV */}
      <nav className={`ev-nav ${scrolled ? "scrolled" : ""}`}>
        <Logo />
        <ul className="ev-nav-links">
          <li>
            <a href="#funkce">Funkce</a>
          </li>
          <li>
            <a href="#cenik">Ceník</a>
          </li>
          <li>
            <a href="#kontakt">Kontakt</a>
          </li>
        </ul>
        <a href="#kontakt" className="ev-nav-cta">
          Získat přístup
        </a>
      </nav>

      {/* HERO */}
      <section className="ev-hero">
        <div className="ev-hero-bg" />
        <div className="ev-hero-grid" />
        <p className="ev-hero-eyebrow">Správa eventů pro profesionály</p>
        <h1 className="ev-hero-title">Každý skvělý event</h1>
        <h1 className="ev-hero-title-2">začíná plánem.</h1>
        <p className="ev-hero-desc">
          Nabídky, rezervace, úkoly a koordinace týmu — vše v jednom elegantním
          dashboardu navrženém pro event profesionály.
        </p>
        <div className="ev-hero-actions">
          <a href="#kontakt" className="ev-btn-primary">
            Začít zdarma
          </a>
          <a href="#funkce" className="ev-btn-ghost">
            Zobrazit funkce
          </a>
        </div>
      </section>

      {/* TICKER */}
      <Ticker />

      {/* STATS */}
      <div className="ev-stats">
        {[
          {
            display: (
              <>
                <AnimatedCounter target={500} />+
              </>
            ),
            label: "Spravovaných eventů",
          },
          {
            display: (
              <>
                <AnimatedCounter target={98} />%
              </>
            ),
            label: "Spokojenost klientů",
          },
          { display: "3×", label: "Rychlejší kalkulace" },
          { display: "0 Kč", label: "Pro začátek" },
        ].map((s, i) => (
          <Reveal key={i} delay={i * 80} className="ev-stat">
            <div className="ev-stat-num">{s.display}</div>
            <div className="ev-stat-label">{s.label}</div>
          </Reveal>
        ))}
      </div>

      {/* FEATURES */}
      <section id="funkce">
        <div className="ev-features">
          <div className="ev-features-header">
            <Reveal>
              <p className="ev-section-label">Vše, co potřebujete</p>
              <h2 className="ev-section-title">
                Vytvořeno pro
                <br />
                <em style={{ fontStyle: "italic", color: "var(--ev-gold)" }}>
                  event
                </em>{" "}
                profesionály
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="ev-section-desc">
                Zapomeňte na Excel. Evavio je chytrý průvodce kalkulací, který
                zpracuje vše od nabídky po výslednou fakturu — v reálném čase.
              </p>
            </Reveal>
          </div>
          <div className="ev-features-grid">
            {features.map((f, i) => (
              <Reveal key={f.num} delay={i * 60} className="ev-feature-card">
                <div className="ev-feature-num">{f.num}</div>
                <div className="ev-feature-icon">{f.icon}</div>
                <h3 className="ev-feature-title">{f.title}</h3>
                <p className="ev-feature-desc">{f.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* EVENT TYPES */}
      <section className="ev-event-types">
        <div className="ev-event-types-inner">
          <Reveal>
            <p className="ev-section-label">Ideální pro</p>
            <h2 className="ev-section-title">
              Každý typ
              <br />
              události
            </h2>
            <p className="ev-section-desc" style={{ marginTop: 16 }}>
              Od intimních soukromých večeří po velké firemní konference —
              Evavio se přizpůsobí vašemu stylu práce.
            </p>
          </Reveal>
          <Reveal delay={150} className="ev-types-grid">
            {eventTypes.map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`ev-type-pill ${activeType === t ? "active" : ""}`}
              >
                {t}
              </button>
            ))}
          </Reveal>
        </div>
      </section>

      {/* DEMO */}
      <section className="ev-demo-section">
        <Reveal className="ev-line-dec">
          <span>Živá kalkulace</span>
        </Reveal>
        <div className="ev-demo-grid">
          <Reveal>
            <p className="ev-section-label">Žádné Excel tabulky</p>
            <h2 className="ev-section-title">
              Kalkulace
              <br />v reálném čase
            </h2>
            <p className="ev-section-desc" style={{ marginTop: 24 }}>
              Klient říká &ldquo;odeberte wellness, je moc drahé&rdquo; —
              odškrtnete položku, celková cena se aktualizuje za 1 sekundu.
              Žádné přepočítávání, žádné chyby.
            </p>
            <div
              style={{
                marginTop: 40,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {[
                "Automatické vyplnění cen z katalogu",
                "Historie verzí při každém odeslání",
                "Export do PDF jedním kliknutím",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    fontSize: 14,
                    color: "var(--ev-muted)",
                  }}
                >
                  <span style={{ color: "var(--ev-gold)", fontSize: 18 }}>
                    ✓
                  </span>{" "}
                  {item}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={150}>
            <DemoCalculator />
          </Reveal>
        </div>
      </section>

      {/* PRICING */}
      <section id="cenik" className="ev-pricing">
        <div className="ev-pricing-inner">
          <Reveal className="ev-pricing-header">
            <p className="ev-section-label">Jednoduché ceny</p>
            <h2 className="ev-section-title">
              Začněte zdarma,
              <br />
              růst bez limitů
            </h2>
          </Reveal>
          <Reveal delay={100} className="ev-pricing-grid">
            {/* Starter */}
            <div className="ev-plan">
              <div className="ev-plan-name">Starter</div>
              <div className="ev-plan-price">Zdarma</div>
              <div className="ev-plan-period">Navždy, bez platební karty</div>
              <ul className="ev-plan-features">
                {[
                  "Až 5 eventů / měsíc",
                  "Kalkulátor nabídek",
                  "Základní checklisty",
                  "E-mailová podpora",
                ].map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a href="#kontakt" className="ev-plan-btn ev-plan-btn--outline">
                Začít
              </a>
            </div>
            {/* Pro */}
            <div className="ev-plan ev-plan--featured">
              <div className="ev-plan-badge">Populární</div>
              <div className="ev-plan-name">Professional</div>
              <div className="ev-plan-price">990 Kč</div>
              <div className="ev-plan-period">za měsíc</div>
              <ul className="ev-plan-features">
                {[
                  "Neomezené eventy",
                  "Kompletní kalkulátor + PDF",
                  "Týmová spolupráce",
                  "Klientský portál",
                  "Analytika & reporty",
                  "Prioritní podpora",
                ].map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a href="#kontakt" className="ev-plan-btn ev-plan-btn--gold">
                Vyzkoušet zdarma
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section id="kontakt" className="ev-cta">
        <div className="ev-cta-bg" />
        <Reveal>
          <p className="ev-section-label" style={{ marginBottom: 24 }}>
            Jste připraveni?
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="ev-cta-title">
            Transformujte váš
            <br />
            <em style={{ fontStyle: "italic", color: "var(--ev-gold)" }}>
              eventový byznys
            </em>
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p
            style={{ color: "var(--ev-muted)", marginBottom: 48, fontSize: 16 }}
          >
            Připojte se k profesionálům, kteří spravují svatby,
            <br />
            teambuildingyyy a firemní eventy s Evavio.
          </p>
        </Reveal>
        <Reveal delay={300}>
          {!formSubmitted ? (
            <form
              className="ev-cta-form"
              onSubmit={(e) => {
                e.preventDefault();
                setFormSubmitted(true);
              }}
            >
              <input
                type="email"
                className="ev-cta-input"
                placeholder="váš@email.cz"
                required
              />
              <button type="submit" className="ev-cta-submit">
                Získat přístup
              </button>
            </form>
          ) : (
            <p
              style={{
                color: "var(--ev-gold)",
                fontSize: 14,
                letterSpacing: "0.1em",
              }}
            >
              ✓ Děkujeme! Ozveme se vám co nejdříve.
            </p>
          )}
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="ev-footer">
        <Logo small />
        <p className="ev-footer-copy">
          Vytvořeno pro event profesionály · © 2025
        </p>
        <div className="ev-footer-links">
          <a href="#">Ochrana soukromí</a>
          <a href="#">Podmínky</a>
        </div>
      </footer>
    </>
  );
}
