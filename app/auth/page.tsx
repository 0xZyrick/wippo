"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import posthog from "posthog-js";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"otp" | "password">("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "signup">("email");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const sendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setInfo("");
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "sign-in",
      });
      if (error) throw new Error(error.message || "Could not send code.");
      setInfo("Check your email for a one-time code.");
      setStep("otp");
      posthog.capture("auth_otp_requested", { email_domain: email.split("@")[1] });
    } catch (error) {
      setErr(
        error instanceof Error
          ? error.message
          : "Could not send a code. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { error } = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp: code.trim(),
      });
      if (error) throw new Error(error.message || "That code did not work.");
      posthog.capture("auth_signed_in", { method: "email_otp" });
      posthog.identify(email.trim().toLowerCase());
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setErr(
        error instanceof Error
          ? error.message
          : "That code did not work. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const signInPassword = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { error } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw new Error(error.message || "Could not sign in.");
      posthog.capture("auth_signed_in", { method: "password" });
      posthog.identify(email.trim().toLowerCase());
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setErr(
        error instanceof Error
          ? error.message
          : "Could not sign in. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const signUpPassword = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { error } = await authClient.signUp.email({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim() || email.split("@")[0],
      });
      if (error) throw new Error(error.message || "Could not create account.");
      posthog.capture("auth_signed_up", { method: "password" });
      posthog.identify(email.trim().toLowerCase());
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setErr(
        error instanceof Error
          ? error.message
          : "Could not create account. Please try again."
      );
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
        <h1 className="mt-6 text-h2 text-white">Sign in</h1>
        <p className="mt-2 text-small text-white/50">
          Powered by Neon Auth. Use a one-time email code, or email and password.
        </p>

        <div className="mt-4 flex gap-2 text-[13px]">
          <button
            type="button"
            onClick={() => {
              setMode("otp");
              setStep("email");
              setErr("");
            }}
            className={`rounded-full px-3 py-1.5 ${
              mode === "otp" ? "bg-white/15 text-white" : "text-white/40"
            }`}
          >
            Email code
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setStep("email");
              setErr("");
            }}
            className={`rounded-full px-3 py-1.5 ${
              mode === "password" ? "bg-white/15 text-white" : "text-white/40"
            }`}
          >
            Password
          </button>
        </div>

        <form
          onSubmit={
            mode === "otp"
              ? step === "otp"
                ? verifyOtp
                : sendOtp
              : step === "signup"
                ? signUpPassword
                : signInPassword
          }
          className="mt-6 space-y-4 rounded-xl border border-white/10 bg-[#181818] p-5"
        >
          {(mode === "otp" && step === "email") ||
          (mode === "password" && step !== "otp") ? (
            <label className="block text-caption text-white/50">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#121212] px-3 py-2.5 text-body text-white outline-none focus:border-white/30"
                placeholder="you@company.com"
              />
            </label>
          ) : null}

          {mode === "otp" && step === "otp" && (
            <>
              <p className="text-small text-white/50">Code sent to {email}</p>
              <label className="block text-caption text-white/50">
                One-time code
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#121212] px-3 py-2.5 text-body text-white outline-none focus:border-white/30"
                  placeholder="6-digit code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </label>
            </>
          )}

          {mode === "password" && (
            <>
              {step === "signup" && (
                <label className="block text-caption text-white/50">
                  Name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#121212] px-3 py-2.5 text-body text-white outline-none focus:border-white/30"
                    placeholder="Your name"
                  />
                </label>
              )}
              <label className="block text-caption text-white/50">
                Password
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#121212] px-3 py-2.5 text-body text-white outline-none focus:border-white/30"
                  placeholder="••••••••"
                  minLength={8}
                />
              </label>
            </>
          )}

          {info && <p className="text-small text-[#FF6B00]">{info}</p>}
          {err && (
            <p className="text-small text-red-300" role="alert">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-[#FF6B00] py-3 text-small font-semibold text-white disabled:opacity-40 hover:brightness-110 transition"
          >
            {busy
              ? "Please wait…"
              : mode === "otp"
                ? step === "otp"
                  ? "Open dashboard"
                  : "Email me a code"
                : step === "signup"
                  ? "Create account"
                  : "Sign in"}
          </button>

          {mode === "otp" && step === "otp" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep("email");
                setCode("");
                setErr("");
                setInfo("");
              }}
              className="w-full text-small text-white/40 hover:text-white transition"
            >
              Use a different email
            </button>
          )}

          {mode === "password" && (
            <button
              type="button"
              onClick={() => {
                setStep(step === "signup" ? "email" : "signup");
                setErr("");
              }}
              className="w-full text-small text-white/40 hover:text-white transition"
            >
              {step === "signup"
                ? "Already have an account? Sign in"
                : "Need an account? Sign up"}
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
