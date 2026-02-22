"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Nesprávný email nebo heslo.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0c0c0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        padding: 24,
      }}
    >
      {/* Background texture */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.04) 0%, transparent 60%),
                          radial-gradient(ellipse at 80% 20%, rgba(91,156,246,0.03) 0%, transparent 50%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 400,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(201,168,76,0.1)",
              border: "1px solid rgba(201,168,76,0.25)",
              marginBottom: 18,
            }}
          >
            <span style={{ fontSize: 24 }}>🏡</span>
          </div>
          <h1
            style={{
              fontFamily: "monospace",
              fontSize: 26,
              fontWeight: 700,
              color: "#c9a84c",
              letterSpacing: "-0.5px",
              margin: 0,
            }}
          >
            EVAVIO
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 13,
              marginTop: 6,
            }}
          >
            Ranč Na Valech — správa akcí
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#13131a",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: "36px 36px 32px",
          }}
        >
          <h2
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: 600,
              margin: "0 0 6px",
            }}
          >
            Přihlášení
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: 13,
              margin: "0 0 28px",
            }}
          >
            Zadejte váš email a heslo
          </p>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 8,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="radek@rancnavalech.cz"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(201,168,76,0.5)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                }
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 8,
                }}
              >
                Heslo
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(201,168,76,0.5)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                }
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "rgba(224,92,92,0.1)",
                  border: "1px solid rgba(224,92,92,0.2)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "#e05c5c",
                  fontSize: 13,
                  marginBottom: 20,
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: loading ? "rgba(201,168,76,0.5)" : "#c9a84c",
                border: "none",
                borderRadius: 8,
                color: "#0c0c0f",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "opacity 0.15s",
              }}
            >
              {loading ? "Přihlašuji..." : "Přihlásit se"}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.2)",
            fontSize: 11,
            marginTop: 24,
            fontFamily: "monospace",
          }}
        >
          EVAVIO · Ranč Na Valech · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
