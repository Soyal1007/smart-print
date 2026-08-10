"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [shopOpen, setShopOpen] = useState(true);
  const [offlineMsg, setOfflineMsg] = useState("");

  useEffect(() => {
    supabase.from("shop_settings").select("is_open, offline_message").eq("id", 1).single()
      .then(({ data }) => { if (data) { setShopOpen(data.is_open); setOfflineMsg(data.offline_message); } });
  }, []);

  return (
    <div className="bg-background text-on-surface min-h-screen" style={{ fontFamily: "'Geist', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      {/* Shop Closed Banner */}
      {!shopOpen && (
        <div className="bg-error text-on-error text-center py-3 px-4 text-label-md font-bold flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
          </svg>
          {offlineMsg || "The print shop is currently closed. Please check back later."}
        </div>
      )}
      {/* TopAppBar */}
      <header className="bg-surface fixed top-0 w-full h-16 flex justify-between items-center px-margin-mobile md:px-margin-desktop z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <img alt="College Logo" className="w-10 h-10 object-contain rounded-full bg-surface-container" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyiu6s2JTPGnswZA1eR1JGMfYFFRlEI0zkrWreT3W4Q0WcScegQcPecqZeJNnTuWtuMb4N8IlmLMeU2wvhcDoTiG3r3-wJpdTVvKLSCUs4s6IrKEf3XFTWAH_g4JgH6Tk6YSTRWifxyHVo9-gF2OE_ObQID0cWOzKiaLYl8A1o4-d8G00AW8h0wDUbwpF5ucQXkMpEakHjVyMapGYMx_UCaT-e-ClojZddPe0VcYcnYUvHawp0A5aB7bUHPikPAHkd2DkPd_kbsTI" />
          <span className="text-title-md font-bold text-primary">Smart Print</span>
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <a className="text-label-md text-primary font-bold" href="#">Home</a>
          <a className="text-label-md text-on-surface-variant hover:bg-surface-variant transition-colors px-3 py-2 rounded-lg" href="#how-it-works">How It Works</a>
          <a className="text-label-md text-on-surface-variant hover:bg-surface-variant transition-colors px-3 py-2 rounded-lg" href="#features">Features</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/login")} className="bg-primary text-on-primary px-6 py-2 rounded-full text-label-md hover:opacity-90 active:scale-95 transition-all">Sign In</button>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-surface py-20 md:py-32">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #093483 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
          </div>
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <img alt="Smart Print Branding" className="w-24 h-24 md:w-32 md:h-32 mb-8 transition-transform hover:scale-110 duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyiu6s2JTPGnswZA1eR1JGMfYFFRlEI0zkrWreT3W4Q0WcScegQcPecqZeJNnTuWtuMb4N8IlmLMeU2wvhcDoTiG3r3-wJpdTVvKLSCUs4s6IrKEf3XFTWAH_g4JgH6Tk6YSTRWifxyHVo9-gF2OE_ObQID0cWOzKiaLYl8A1o4-d8G00AW8h0wDUbwpF5ucQXkMpEakHjVyMapGYMx_UCaT-e-ClojZddPe0VcYcnYUvHawp0A5aB7bUHPikPAHkd2DkPd_kbsTI" />
              <h1 className="text-headline-xl md:text-[64px] text-primary mb-6 tracking-tight leading-tight font-bold">Smart Print</h1>
              <p className="text-body-lg text-on-surface-variant mb-12 max-w-2xl">
                Upload. Pay. Print. Collect. <br className="hidden md:block" />
                The official campus utility designed for speed-of-thought productivity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button onClick={() => router.push("/login")} className="bg-primary text-on-primary h-14 px-10 rounded-xl text-label-md text-lg hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">cloud_upload</span>
                  Upload Documents
                </button>
                <button onClick={() => router.push("/student/dashboard")} className="bg-surface-container text-primary h-14 px-10 rounded-xl text-label-md text-lg hover:bg-surface-variant active:scale-95 transition-all border border-primary/10 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">description</span>
                  View Print Status
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Features Section */}
        <section className="py-24 bg-white" id="features">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="mb-16">
              <span className="text-secondary text-label-sm uppercase tracking-widest mb-2 block">System Features</span>
              <h2 className="text-headline-lg text-on-surface">Precision Printing Utilities</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Feature 1 */}
              <div className="md:col-span-8 bg-surface-container-low p-8 rounded-[32px] hover:shadow-md transition-shadow group">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-on-primary mb-6 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined">cloud_upload</span>
                    </div>
                    <h3 className="text-title-md text-on-surface mb-3">Upload from anywhere</h3>
                    <p className="text-on-surface-variant">Submit documents from your dorm, the cafeteria, or on your way to class. We support PDF, DOCX, and high-res imagery.</p>
                  </div>
                  <div className="w-full md:w-1/2 aspect-video bg-white rounded-2xl shadow-sm border border-outline-variant overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                    <div className="p-6 flex flex-col gap-3">
                      <div className="h-4 w-3/4 bg-surface-container rounded"></div>
                      <div className="h-4 w-1/2 bg-surface-container rounded"></div>
                      <div className="mt-4 flex justify-center">
                        <span className="material-symbols-outlined text-primary text-6xl opacity-20">upload_file</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Feature 2 */}
              <div className="md:col-span-4 bg-tertiary-container p-8 rounded-[32px] text-on-tertiary relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-tertiary-fixed rounded-2xl flex items-center justify-center text-on-tertiary-fixed mb-6 group-hover:rotate-12 transition-transform">
                    <span className="material-symbols-outlined">calculate</span>
                  </div>
                  <h3 className="text-title-md mb-3">Real-time Cost</h3>
                  <p className="opacity-80">Instant calculation based on page count, color density, and paper stock selection.</p>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-10">
                  <span className="material-symbols-outlined text-[120px]">payments</span>
                </div>
              </div>
              {/* Feature 3 */}
              <div className="md:col-span-4 bg-secondary-container p-8 rounded-[32px] text-on-secondary-container group">
                <div className="w-12 h-12 bg-secondary-fixed rounded-2xl flex items-center justify-center text-on-secondary-fixed mb-6 group-hover:scale-95 transition-transform">
                  <span className="material-symbols-outlined">contactless</span>
                </div>
                <h3 className="text-title-md mb-3">Online Payment</h3>
                <p className="opacity-80">Securely pay using UPI, credit card, or digital wallets via Razorpay.</p>
              </div>
              {/* Feature 4 */}
              <div className="md:col-span-8 bg-surface-container-high p-8 rounded-[32px] group">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-full md:w-1/3 flex justify-center">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent animate-spin" style={{ animationDuration: '3s' }}></div>
                      <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary text-4xl">print</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-title-md text-on-surface mb-3">Industrial Reliability</h3>
                    <p className="text-on-surface-variant">Powered by high-capacity campus hubs. No more waiting for jammed residential printers during finals week.</p>
                    <div className="mt-4 flex gap-2">
                      <span className="bg-on-primary-fixed-variant/10 text-on-primary-fixed-variant px-3 py-1 rounded-full text-label-sm">Laser Precision</span>
                      <span className="bg-on-primary-fixed-variant/10 text-on-primary-fixed-variant px-3 py-1 rounded-full text-label-sm">24/7 Monitoring</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-surface border-y border-outline-variant/30" id="how-it-works">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="text-center mb-20">
              <h2 className="text-headline-lg text-primary mb-4">Five Steps to Print</h2>
              <p className="text-on-surface-variant">Streamlined from start to finish</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
              {[
                { icon: 'upload', label: 'Upload', desc: 'Drag and drop your document online' },
                { icon: 'settings_suggest', label: 'Settings', desc: 'Choose color, sides, and copies' },
                { icon: 'account_balance_wallet', label: 'Pay', desc: 'Confirm with UPI or Card' },
                { icon: 'auto_mode', label: 'Auto Print', desc: 'Queue processes automatically' },
                { icon: 'inventory_2', label: 'Collect', desc: 'Pick up at the Hub' },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <div className={`w-20 h-20 bg-white shadow-md rounded-3xl flex items-center justify-center mb-6 relative z-10 border border-outline-variant/50 group-hover:bg-primary group-hover:text-on-primary transition-colors ${i < 4 ? 'step-line' : ''}`}>
                    <span className="material-symbols-outlined text-3xl">{step.icon}</span>
                  </div>
                  <h4 className="text-label-md text-on-surface font-bold mb-2">{step.label}</h4>
                  <p className="text-label-sm text-on-surface-variant">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="bg-primary rounded-[40px] p-8 md:p-20 text-center text-on-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container rounded-full -translate-y-1/2 translate-x-1/2 opacity-30 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary rounded-full translate-y-1/2 -translate-x-1/2 opacity-20 blur-3xl"></div>
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-headline-lg mb-6">Ready to skip the queue?</h2>
                <p className="text-body-lg mb-12 opacity-90">Join students using Smart Print daily for their assignments and projects.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button onClick={() => router.push("/login")} className="bg-on-primary text-primary h-16 px-12 rounded-2xl font-bold text-lg hover:bg-surface-container transition-all active:scale-95 shadow-xl">
                    Start Printing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface py-12 border-t border-outline-variant">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-label-md font-bold text-on-surface">Smart Print Campus Utilities</span>
            <p className="text-label-sm text-on-surface-variant">© 2026 Smart Print Campus Utilities</p>
            <p className="text-label-sm text-outline">Built by <span className="text-primary font-semibold">Soyal Binu Eapen</span></p>
          </div>
          <div className="flex gap-6">
            <a className="text-label-sm text-on-surface-variant hover:underline decoration-2 underline-offset-4 transition-all" href="/support">Support</a>
            <a className="text-label-sm text-on-surface-variant hover:underline decoration-2 underline-offset-4 transition-all" href="/student/dashboard">Print History</a>
            <a className="text-label-sm text-on-surface-variant hover:underline decoration-2 underline-offset-4 transition-all" href="#">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-surface-container-lowest shadow-[0px_-4px_20px_rgba(0,0,0,0.05)] rounded-t-xl">
        <button onClick={() => router.push("/login")} className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-1">
          <span className="material-symbols-outlined">cloud_upload</span>
          <span className="text-label-sm">Upload</span>
        </button>
        <button onClick={() => router.push("/student/dashboard")} className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-1">
          <span className="material-symbols-outlined">description</span>
          <span className="text-label-sm">My Prints</span>
        </button>
        <button onClick={() => router.push("/login")} className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-1">
          <span className="material-symbols-outlined">person</span>
          <span className="text-label-sm">Profile</span>
        </button>
      </nav>
    </div>
  );
}
