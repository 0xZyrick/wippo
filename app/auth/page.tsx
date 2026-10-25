"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [demoCode, setDemoCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const requestCode = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send code");
      if (data.demoCode) setDemoCode(data.demoCode);
      setStep("otp");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-full grid place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="text-small text-white/40 hover:text-white">
          ← Home
        </Link>
        <h1 className="mt-6 text-h2 text-white">Admin sign-in</h1>
        <p className="mt-2 text-small text-white/50">
          One-time email code. After this, the dashboard stays open — no more
          login walls while you work.
        </p>

        <form
          onSubmit={step === "email" ? requestCode : verify}
          className="mt-8 space-y-4 rounded-xl border border-white/10 bg-surface p-5"
        >
          {step === "email" ? (
            <label className="block text-caption text-white/50">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-page px-3 py-2.5 text-body text-white outline-none focus:border-white/30"
                placeholder="you@company.com"
              />
            </label>
          ) : (
            <>
              <p className="text-small text-white/50">Code sent to {email}</p>
              {demoCode && (
                <p className="text-caption text-growth">
                  Demo code: <strong>{demoCode}</strong>
                </p>
              )}
              <label className="block text-caption text-white/50">
                One-time code
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-page px-3 py-2.5 text-body text-white outline-none focus:border-white/30"
                  placeholder="6-digit code"
                />
              </label>
            </>
          )}
          {err && (
            <p className="text-small text-red-300" role="alert">
              {err}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-coral py-3 text-small font-semibold text-white disabled:opacity-40"
          >
            {busy ? "…" : step === "email" ? "Email me a code" : "Open dashboard"}
          </button>
        </form>
      </div>
    </main>
  );
}
