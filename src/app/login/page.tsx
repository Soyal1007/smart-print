"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithUID } from "@/app/actions/auth";

export default function LoginPage() {
  const [uid, setUid] = useState("");
  const [pin, setPin] = useState("");
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden" style={{ fontFamily: "'Geist', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      {/* Background Atmosphere */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden opacity-50">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[5%] right-[0%] w-[30%] h-[30%] rounded-full bg-secondary/5 blur-[100px]"></div>
      </div>

      <main className="w-full max-w-sm mx-auto px-6 flex flex-col items-center gap-10 py-12">
        {/* Brand Identity */}
        <div className="flex flex-col items-center space-y-6">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-surface-container rounded-3xl p-4 shadow-sm flex items-center justify-center">
            <img
              alt="Smart Print Logo"
              className="w-full h-full object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyiu6s2JTPGnswZA1eR1JGMfYFFRlEI0zkrWreT3W4Q0WcScegQcPecqZeJNnTuWtuMb4N8IlmLMeU2wvhcDoTiG3r3-wJpdTVvKLSCUs4s6IrKEf3XFTWAH_g4JgH6Tk6YSTRWifxyHVo9-gF2OE_ObQID0cWOzKiaLYl8A1o4-d8G00AW8h0wDUbwpF5ucQXkMpEakHjVyMapGYMx_UCaT-e-ClojZddPe0VcYcnYUvHawp0A5aB7bUHPikPAHkd2DkPd_kbsTI"
            />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface tracking-tight">
              Smart Print Login
            </h1>
            <p className="text-body-md text-on-surface-variant">
              {step === "uid" ? "Enter your College UID to continue" : "Enter your password to sign in"}
            </p>
          </div>
        </div>

        {/* Login Form Section */}
        <section className="w-full bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30">
          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex-1 h-1 rounded-full transition-all ${step === 'uid' || step === 'pin' ? 'bg-primary' : 'bg-outline-variant'}`}></div>
            <div className={`flex-1 h-1 rounded-full transition-all ${step === 'pin' ? 'bg-primary' : 'bg-outline-variant'}`}></div>
          </div>

          {step === "uid" ? (
            <form className="space-y-8" onSubmit={handleUidSubmit}>
              <div className="space-y-4">
                <label className="block text-label-md text-primary font-bold" htmlFor="uid">
                  COLLEGE UID
                </label>
                <div className="relative group">
                  <input
                    autoFocus
                    className="w-full h-16 px-6 bg-surface-container-low border-2 border-transparent focus:border-primary focus:ring-0 rounded-xl text-headline-lg-mobile text-on-surface transition-all duration-200 placeholder:text-outline/30 placeholder:tracking-normal outline-none"
                    id="uid"
                    inputMode="numeric"
                    placeholder="25013003"
                    value={uid}
                    onChange={e => setUid(e.target.value.replace(/[^0-9A-Za-z]/g, ''))}
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary">
                    <span className="material-symbols-outlined">badge</span>
                  </div>
                </div>
                <p className="text-label-sm text-outline px-2">Your UID is printed on your student identification card.</p>
              </div>
              <button
                className="w-full h-14 md:h-16 bg-primary text-on-primary text-title-md rounded-xl shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 group"
                type="submit"
              >
                Continue
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
              </button>
            </form>
          ) : (
            <form className="space-y-8" onSubmit={handlePinSubmit}>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => { setStep("uid"); setPin(""); setError(""); }}
                    className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-xl">arrow_back</span>
                  </button>
                  <div className="flex-1 bg-surface-container px-4 py-2 rounded-xl">
                    <p className="text-label-sm text-on-surface-variant">Signing in as</p>
                    <p className="text-label-md font-bold text-primary">{isOwner ? "Shop Owner (ADMIN)" : `UID: ${uid}`}</p>
                  </div>
                </div>
                <label className="block text-label-md text-primary font-bold" htmlFor="pin">
                  {isOwner ? "ADMIN PASSWORD" : "PASSWORD"}
                </label>
                <div className="relative group">
                  <input
                    autoFocus
                    className="w-full h-16 px-6 bg-surface-container-low border-2 border-transparent focus:border-primary focus:ring-0 rounded-xl text-title-md text-on-surface transition-all duration-200 placeholder:text-outline/30 outline-none tracking-widest"
                    id="pin"
                    type="password"
                    placeholder="••••••••"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary">
                    <span className="material-symbols-outlined">lock</span>
                  </div>
                </div>
                {!isOwner && <p className="text-label-sm text-outline px-2">First time logging in? Set your password now. You'll use this every time.</p>}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-error-container text-on-error-container p-4 rounded-xl text-label-md">
                  <span className="material-symbols-outlined text-error">error</span>
                  {error}
                </div>
              )}

              <button
                disabled={loading || success}
                className={`w-full h-14 md:h-16 text-title-md rounded-xl shadow-md active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 group disabled:opacity-80 ${success ? 'bg-tertiary text-on-tertiary' : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'}`}
                type="submit"
              >
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin">sync</span>Signing in...</>
                ) : success ? (
                  <><span className="material-symbols-outlined">check_circle</span>Verified!</>
                ) : (
                  <><span className="material-symbols-outlined">login</span>Sign In</>
                )}
              </button>
            </form>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center">
          <p className="text-label-sm text-outline-variant">© 2024 Smart Print Campus Utilities</p>
        </footer>
      </main>
    </div>
  );
}
