"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { use } from "react";
import { getSession } from "@/app/actions/auth";

export default function CheckoutPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const user = await getSession();
      if (!user) { router.push("/login"); return; }
      setUid(user.uid);
      if (user.name) setName(user.name);

      const { data } = await supabase
        .from("print_jobs")
        .select("*, job_files(*)")
        .eq("id", jobId)
        .single();

      if (data) {
        setJob(data);
        // Already processed — skip straight to queue/printing status
        if (["paid", "queued", "printing", "printed"].includes(data.status)) {
          router.replace(`/student/queue-status/${jobId}`);
          return;
        }
      }
      setLoading(false);
    };
    init();
  }, [jobId]);

  // ─── Simulate payment success (testing mode) ───────────────────────────────
  const handlePayment = async () => {
    if (!job) return;
    setPaying(true);

    try {
      // Auto-start printing immediately on payment — no owner approval needed
      const { error } = await supabase
        .from("print_jobs")
        .update({
          status: "printing",           // ← skip "queued", go straight to printing
          razorpay_order_id: `test_order_${Date.now()}`,
          razorpay_payment_id: `test_pay_${Date.now()}`,
        })
        .eq("id", jobId);

      if (error) throw error;

      setPaid(true);
      // Short delay so the success animation plays, then redirect
      setTimeout(() => router.push(`/student/queue-status/${jobId}`), 1800);
    } catch (err: any) {
      alert("Something went wrong: " + err.message);
      setPaying(false);
    }
  };

  const amount     = job?.total_price_paise ? (job.total_price_paise / 100).toFixed(2) : "0.00";
  const pages      = job?.total_pages || 0;
  const file       = job?.job_files?.[0];
  const filename   = file?.original_filename || "Document";
  const colorMode  = file?.color_mode === "color" ? "Color" : "B&W";
  const sides      = file?.sides === "double" ? "Double Side" : "Single Side";
  const copies     = file?.copies || 1;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: 48 }}>sync</span>
    </div>
  );

  if (paid) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 text-center px-8"
      style={{ fontFamily: "'Geist', sans-serif" }}>
      <div className="w-28 h-28 bg-tertiary-container rounded-full flex items-center justify-center shadow-xl animate-[float_2s_ease-in-out_infinite]">
        <svg className="w-16 h-16" fill="none" stroke="#4edea3" strokeWidth="3" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="text-headline-lg-mobile text-on-surface font-bold">Payment Successful!</h1>
      <p className="text-body-md text-on-surface-variant">Your job has been added to the print queue.</p>
      <div className="flex items-center gap-2 text-label-sm text-tertiary">
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
        Redirecting to queue status…
      </div>
    </div>
  );

  return (
    <div
      className="bg-background text-on-background min-h-screen flex flex-col"
      style={{ fontFamily: "'Geist', sans-serif", WebkitFontSmoothing: "antialiased" }}
    >
      {/* TopAppBar */}
      <header className="bg-surface shadow-sm fixed top-0 w-full h-16 z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary overflow-hidden">
            <img
              alt="Logo"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyiu6s2JTPGnswZA1eR1JGMfYFFRlEI0zkrWreT3W4Q0WcScegQcPecqZeJNnTuWtuMb4N8IlmLMeU2wvhcDoTiG3r3-wJpdTVvKLSCUs4s6IrKEf3XFTWAH_g4JgH6Tk6YSTRWifxyHVo9-gF2OE_ObQID0cWOzKiaLYl8A1o4-d8G00AW8h0wDUbwpF5ucQXkMpEakHjVyMapGYMx_UCaT-e-ClojZddPe0VcYcnYUvHawp0A5aB7bUHPikPAHkd2DkPd_kbsTI"
            />
          </div>
          <span className="text-title-md font-bold text-primary">Smart Print</span>
        </div>
        <span className="text-label-md text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">
          {name ? `${name} (${uid})` : `UID: ${uid}`}
        </span>
      </header>

      <main className="flex-grow pt-24 pb-24 px-margin-mobile md:px-margin-desktop max-w-lg mx-auto w-full flex flex-col gap-6">

        {/* Testing-mode banner */}
        <div className="flex items-center gap-3 p-4 bg-secondary-container/20 border border-secondary/20 rounded-xl">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
            science
          </span>
          <div>
            <p className="text-label-md text-secondary font-bold">Testing Mode · Auto-Print Enabled</p>
            <p className="text-label-sm text-on-surface-variant">Payment simulated · Printing starts immediately — no shop approval needed</p>
          </div>
        </div>

        {/* Order Summary */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-6 flex flex-col gap-4">
          <h1 className="text-headline-lg-mobile text-primary">Order Summary</h1>

          {/* File card */}
          <div className="flex items-center gap-4 pb-4 border-b border-outline-variant">
            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-on-primary-container">picture_as_pdf</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-label-md font-bold text-on-surface truncate">{filename}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className="text-label-sm text-on-surface-variant">{pages} pages</span>
                <span className="text-label-sm text-outline">•</span>
                <span className="text-label-sm text-on-surface-variant">{colorMode}</span>
                <span className="text-label-sm text-outline">•</span>
                <span className="text-label-sm text-on-surface-variant">{sides}</span>
                <span className="text-label-sm text-outline">•</span>
                <span className="text-label-sm text-on-surface-variant">{copies} {copies > 1 ? "Copies" : "Copy"}</span>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-body-md text-on-surface-variant">Print Type</span>
              <span className="text-label-md text-on-surface">{colorMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-md text-on-surface-variant">Page Style</span>
              <span className="text-label-md text-on-surface">{sides}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-md text-on-surface-variant">Copies</span>
              <span className="text-label-md text-on-surface">{copies}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-body-md text-on-surface-variant">Total Pages</span>
              <span className="text-label-md text-on-surface">{pages}</span>
            </div>
            <div className="pt-4 border-t border-dashed border-outline-variant flex justify-between items-center">
              <span className="text-title-md text-primary font-bold">Total</span>
              <span className="text-headline-lg-mobile text-primary font-bold">₹{amount}</span>
            </div>
          </div>
        </section>

        {/* Security Badge */}
        <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/50">
          <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
            shield
          </span>
          <div>
            <p className="text-label-md text-on-surface font-bold">Secure Checkout</p>
            <p className="text-label-sm text-on-surface-variant">Powered by Razorpay • 256-bit encrypted</p>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={paying}
          className="w-full h-16 bg-primary text-on-primary text-title-md rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-150 disabled:opacity-80 disabled:pointer-events-none"
        >
          {paying ? (
            <>
              <span className="material-symbols-outlined animate-spin">sync</span>
              Processing Payment…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">contactless</span>
              Pay ₹{amount} &amp; Print
            </>
          )}
        </button>

        <p className="text-center text-label-sm text-on-surface-variant">
          Your documents will automatically queue for printing once payment is confirmed.
        </p>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-surface-container-lowest shadow-[0px_-4px_20px_rgba(0,0,0,0.05)] rounded-t-xl">
        <button onClick={() => router.push("/student/upload")} className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-1">
          <span className="material-symbols-outlined">cloud_upload</span>
          <span className="text-label-sm">Upload</span>
        </button>
        <div className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-2xl px-6 py-1 scale-105">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          <span className="text-label-sm">My Prints</span>
        </div>
        <button onClick={() => router.push("/student/dashboard")} className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-1">
          <span className="material-symbols-outlined">person</span>
          <span className="text-label-sm">Profile</span>
        </button>
      </nav>
    </div>
  );
}
