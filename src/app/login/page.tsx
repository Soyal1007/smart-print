"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithUID } from "@/app/actions/auth";

export default function LoginPage() {
  const [uid, setUid] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [step, setStep] = useState<"uid" | "pin">("uid");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const isOwner = uid.toUpperCase() === "ADMIN";

  const handleUidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid.trim()) return;
    setError("");
    setStep("pin");
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await loginWithUID(uid, pin, isOwner);
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push(isOwner ? "/owner/dashboard" : "/student/upload");
        }, 1000);
      }
    } catch {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden"
      style={{ fontFamily: "'Geist', sans-serif", WebkitFontSmoothing: "antialiased" }}
    >
      {/* Background atmosphere */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[5%] right-[0%] w-[30%] h-[30%] rounded-full bg-secondary/5 blur-[100px]" />
      </div>

      <main className="w-full max-w-sm mx-auto px-6 flex flex-col items-center gap-8 py-12">

        {/* Brand */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-28 h-28 bg-surface-container rounded-3xl p-3 shadow-sm flex items-center justify-center">
            <img
              alt="Smart Print Logo"
              className="w-full h-full object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyiu6s2JTPGnswZA1eR1JGMfYFFRlEI0zkrWreT3W4Q0WcScegQcPecqZeJNnTuWtuMb4N8IlmLMeU2wvhcDoTiG3r3-wJpdTVvKLSCUs4s6IrKEf3XFTWAH_g4JgH6Tk6YSTRWifxyHVo9-gF2OE_ObQID0cWOzKiaLYl8A1o4-d8G00AW8h0wDUbwpF5ucQXkMpEakHjVyMapGYMx_UCaT-e-ClojZddPe0VcYcnYUvHawp0A5aB7bUHPikPAHkd2DkPd_kbsTI"
            />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-headline-lg-mobile text-on-surface tracking-tight">Smart Print Login</h1>
            <p className="text-body-md text-on-surface-variant">
              {step === "uid" ? "Enter your College UID to continue" : "Enter your password to sign in"}
            </p>
          </div>
        </div>

        {/* Card */}
        <section className="w-full bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex-1 h-1 rounded-full bg-primary transition-all" />
            <div className={`flex-1 h-1 rounded-full transition-all ${step === "pin" ? "bg-primary" : "bg-outline-variant"}`} />
          </div>

          {step === "uid" ? (
            <form className="space-y-8" onSubmit={handleUidSubmit}>
              <div className="space-y-3">
                <label className="block text-label-md text-primary font-bold" htmlFor="uid">
                  COLLEGE UID
                </label>
                <div className="relative group">
                  <input
                    autoFocus
                    className="w-full h-16 px-6 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-xl text-headline-lg-mobile text-on-surface transition-all duration-200 placeholder:text-outline/30 outline-none"
                    id="uid"
                    inputMode="numeric"
                    placeholder="e.g. 25013XXX"
                    value={uid}
                    onChange={e => setUid(e.target.value.replace(/[^0-9A-Za-z]/g, ""))}
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary">
                    <span className="material-symbols-outlined">badge</span>
                  </div>
                </div>
                <p className="text-label-sm text-outline px-2">Your UID is printed on your student identification card.</p>
              </div>
              <button
                className="w-full h-14 bg-primary text-on-primary text-title-md rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 group"
                type="submit"
              >
                Continue
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
              </button>
            </form>
          ) : (
            <form className="space-y-8" onSubmit={handlePinSubmit}>
              <div className="space-y-3">
                {/* Back + who */}
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => { setStep("uid"); setPin(""); setError(""); }}
                    className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-xl">arrow_back</span>
                  </button>
                  <div className="flex-1 bg-surface-container px-4 py-2 rounded-xl">
                    <p className="text-label-sm text-on-surface-variant">Signing in as</p>
                    <p className="text-label-md font-bold text-primary">
                      {isOwner ? "Shop Owner (ADMIN)" : `UID: ${uid}`}
                    </p>
                  </div>
                </div>

                <label className="block text-label-md text-primary font-bold" htmlFor="pin">
                  {isOwner ? "ADMIN PASSWORD" : "PASSWORD"}
                </label>

                {/* Password field with show/hide */}
                <div className="relative group">
                  <input
                    autoFocus
                    className="w-full h-16 px-6 pr-14 bg-surface-container-low border-2 border-transparent focus:border-primary rounded-xl text-title-md text-on-surface transition-all duration-200 placeholder:text-outline/30 outline-none tracking-widest"
                    id="pin"
                    type={showPin ? "text" : "password"}
                    placeholder="••••••••"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(v => !v)}
                    className="absolute inset-y-0 right-4 flex items-center text-outline hover:text-primary transition-colors"
                    tabIndex={-1}
                    aria-label={showPin ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined">
                      {showPin ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>

                {!isOwner && (
                  <p className="text-label-sm text-outline px-2">
                    First time? Set your password now. You'll use this every time.
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-error-container text-on-error-container p-4 rounded-xl text-label-md">
                  <span className="material-symbols-outlined text-error">error</span>
                  {error}
                </div>
              )}

              <button
                disabled={loading || success}
                className={`w-full h-14 text-title-md rounded-xl shadow-md active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-80
                  ${success ? "bg-tertiary text-on-tertiary" : "bg-primary text-on-primary hover:opacity-90"}`}
                type="submit"
              >
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin">sync</span>Signing in…</>
                ) : success ? (
                  <><span className="material-symbols-outlined">check_circle</span>Verified!</>
                ) : (
                  <><span className="material-symbols-outlined">login</span>Sign In</>
                )}
              </button>
            </form>
          )}
        </section>

        {/* Footer / credits */}
        <footer className="text-center space-y-1">
          <p className="text-label-sm text-outline-variant">© 2026 Smart Print Campus Utilities</p>
          <p className="text-label-sm text-outline">
            Built by <span className="text-primary font-semibold">Soyal Binu Eapen</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
