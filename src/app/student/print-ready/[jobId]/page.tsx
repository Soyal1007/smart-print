"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { use } from "react";
import { getSession } from "@/app/actions/auth";

export default function PrintReadyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [uid, setUid] = useState("");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const user = await getSession();
      if (user) { setUid(user.uid); if (user.name) setName(user.name); }
    };
    init();
  }, []);

  const handleCopyUID = async () => {
    try {
      await navigator.clipboard.writeText(uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* fallback */ }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center overflow-x-hidden" style={{ fontFamily: "'Geist', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      {/* TopAppBar */}
      <header className="bg-surface shadow-sm fixed top-0 w-full z-50 h-16 flex justify-between items-center px-margin-mobile">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold overflow-hidden">
            <img alt="College Logo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyiu6s2JTPGnswZA1eR1JGMfYFFRlEI0zkrWreT3W4Q0WcScegQcPecqZeJNnTuWtuMb4N8IlmLMeU2wvhcDoTiG3r3-wJpdTVvKLSCUs4s6IrKEf3XFTWAH_g4JgH6Tk6YSTRWifxyHVo9-gF2OE_ObQID0cWOzKiaLYl8A1o4-d8G00AW8h0wDUbwpF5ucQXkMpEakHjVyMapGYMx_UCaT-e-ClojZddPe0VcYcnYUvHawp0A5aB7bUHPikPAHkd2DkPd_kbsTI" />
          </div>
          <span className="text-title-md font-bold text-primary">Smart Print</span>
        </div>
        <div className="text-label-md text-primary bg-surface-container-high px-3 py-1 rounded-full">
          UID: {uid}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-lg flex flex-col items-center justify-center px-margin-mobile pt-24 pb-12 text-center">
        {/* Success Animation Container */}
        <div className="relative w-48 h-48 mb-unit animate-float">
          <div className="absolute inset-0 bg-tertiary-fixed-dim opacity-20 rounded-full scale-110 animate-pulse"></div>
          <div className="absolute inset-4 bg-tertiary-fixed-dim opacity-30 rounded-full scale-105"></div>
          <div className="relative w-full h-full bg-tertiary-container rounded-full flex items-center justify-center success-glow">
            <svg className="w-24 h-24 text-tertiary-fixed" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path className="check-draw" d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-surface mt-8 mb-4">
          Your documents are ready for collection
        </h1>

        {/* Instruction */}
        <p className="text-body-md text-on-surface-variant max-w-xs mb-10 leading-relaxed">
          Visit the collection counter and collect your documents using your UID.
        </p>

        {/* UID Display Card */}
        <div className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-8 mb-12 shadow-sm transition-all hover:shadow-md group">
          <span className="text-label-md text-outline uppercase tracking-widest block mb-2">Collection Identification</span>
          <div className="flex items-center justify-center gap-4">
            <span className="text-headline-xl text-primary select-all">{uid}</span>
            <button
              className="material-symbols-outlined text-primary-container p-2 rounded-full hover:bg-primary-container hover:text-on-primary-container transition-colors active:scale-90"
              title="Copy UID"
              onClick={handleCopyUID}
            >
              {copied ? 'check' : 'content_copy'}
            </button>
          </div>
          {name && <p className="text-label-sm text-outline mt-2">{name}</p>}
        </div>

        {/* Actions */}
        <div className="w-full space-y-4">
          <button
            onClick={() => router.push("/student/upload")}
            className="w-full h-14 bg-primary text-on-primary text-title-md rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-primary-container transition-all active:scale-[0.98] duration-150"
          >
            <span className="material-symbols-outlined">home</span>
            Go Home
          </button>
          <button
            onClick={() => router.push("/student/dashboard")}
            className="w-full h-12 bg-transparent text-primary text-label-md rounded-xl border border-primary/20 hover:bg-primary/5 transition-colors"
          >
            View Print History
          </button>
        </div>

        {/* Progress Complete Indicator */}
        <div className="mt-16 w-full flex items-center gap-2">
          <div className="h-1 bg-tertiary-fixed-dim flex-grow rounded-full"></div>
          <div className="h-1 bg-tertiary-fixed-dim flex-grow rounded-full"></div>
          <div className="h-1 bg-tertiary-fixed-dim flex-grow rounded-full"></div>
        </div>
        <div className="mt-2 text-label-sm text-tertiary flex items-center gap-1 justify-center">
          <span className="material-symbols-outlined text-[14px]">verified</span>
          Transaction Finalized
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-unit px-margin-mobile flex flex-col md:flex-row justify-between items-center gap-4 bg-surface border-t border-outline-variant">
        <div className="text-label-md font-bold text-on-surface">© 2024 Smart Print Campus Utilities</div>
        <nav className="flex gap-6">
          <a className="text-on-surface-variant text-label-sm hover:underline decoration-2 underline-offset-4 transition-all opacity-80 hover:opacity-100" href="#">Support</a>
          <a className="text-on-surface-variant text-label-sm hover:underline decoration-2 underline-offset-4 transition-all opacity-80 hover:opacity-100" href="#">Print History</a>
          <a className="text-on-surface-variant text-label-sm hover:underline decoration-2 underline-offset-4 transition-all opacity-80 hover:opacity-100" href="#">Terms of Service</a>
        </nav>
      </footer>
    </div>
  );
}
