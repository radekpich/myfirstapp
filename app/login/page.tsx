"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // LOGIN
  const handleLogin = async () => {
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      router.push("/dashboard");
    }
  };

  // REGISTER
  const handleSignUp = async () => {
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Account created ✅ Now you can login.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="bg-[#111] p-10 w-full max-w-sm border border-white/10">
        <h1
          className="text-2xl text-[#c9a84c] mb-8 text-center tracking-widest uppercase"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Evavio
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 mb-4 outline-none focus:border-[#c9a84c]"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 mb-6 outline-none focus:border-[#c9a84c]"
        />

        {message && (
          <p className="text-sm mb-4 text-center text-white/70">{message}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#c9a84c] text-black py-3 font-medium tracking-widest uppercase hover:bg-[#e0c070] transition-all disabled:opacity-50"
        >
          {loading ? "Loading..." : "Login"}
        </button>

        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full mt-4 border border-[#c9a84c] text-[#c9a84c] py-3 font-medium tracking-widest uppercase hover:bg-[#c9a84c] hover:text-black transition-all disabled:opacity-50"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
