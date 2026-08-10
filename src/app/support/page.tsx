"use client";
import { useRouter } from "next/navigation";

export default function SupportPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen bg-background text-on-surface flex flex-col"
      style={{ fontFamily: "'Geist', sans-serif", WebkitFontSmoothing: "antialiased" }}
    >
      {/* Header */}
      <header className="bg-surface shadow-sm sticky top-0 z-50 flex items-center gap-4 px-6 h-16">
        <button
          onClick={() => router.back()}
          className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
        >
          arrow_back
        </button>
        <span className="text-title-md font-bold text-primary">Smart Print · Support</span>
      </header>

      <main className="flex-grow max-w-2xl mx-auto w-full px-6 py-12 flex flex-col gap-10">

        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-on-primary text-4xl">print</span>
          </div>
          <h1 className="text-headline-lg text-on-surface font-bold">Smart Print</h1>
          <p className="text-body-md text-on-surface-variant max-w-md">
            Autonomous campus printing — upload, pay, and collect. Built for students, by a student.
          </p>
        </div>

        {/* Creator Card */}
        <div className="bg-surface-container rounded-3xl p-8 flex flex-col gap-5 shadow-sm border border-outline-variant/30">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">person</span>
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant uppercase tracking-widest">Developer &amp; Creator</p>
              <p className="text-title-md font-bold text-on-surface">Soyal Binu Eapen</p>
            </div>
          </div>
          <p className="text-body-md text-on-surface-variant">
            Smart Print was designed and developed entirely by Soyal Binu Eapen as a campus utility project
            to simplify the printing workflow for students. From database design to payment integration —
            built from scratch.
          </p>
          <div className="flex flex-col gap-3 pt-2 border-t border-outline-variant/30">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">school</span>
              <span className="text-body-md text-on-surface-variant">Campus Print Shop System · 2026</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">build</span>
              <span className="text-body-md text-on-surface-variant">
                Built with Next.js, Supabase &amp; Razorpay
              </span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="flex flex-col gap-4">
          <h2 className="text-title-md font-bold text-on-surface">Frequently Asked Questions</h2>
          {[
            {
              q: "How do I upload a file?",
              a: "Log in with your student ID and PIN, go to Upload, and drag-and-drop or browse for your file. Supported formats: PDF, DOCX, PPTX, JPG, PNG.",
            },
            {
              q: "What payment methods are accepted?",
              a: "We accept UPI, credit/debit cards, and net banking via Razorpay. All transactions are secure and encrypted.",
            },
            {
              q: "How do I collect my printout?",
              a: "After payment, you'll receive a 4-digit token. Show it at the print shop counter and your documents will be ready.",
            },
            {
              q: "What if the shop is closed?",
              a: "The shop owner controls open/close hours. You'll see a 'Shop Closed' notice when it's unavailable. Try again later or check back during working hours.",
            },
            {
              q: "I paid but my job isn't showing?",
              a: "Wait a few seconds and refresh your dashboard. If the issue persists, note your transaction ID and contact the shop operator.",
            },
          ].map(({ q, a }) => (
            <details
              key={q}
              className="group bg-surface-container-low border border-outline-variant/30 rounded-2xl px-5 py-4 cursor-pointer"
            >
              <summary className="text-label-md font-bold text-on-surface list-none flex justify-between items-center select-none">
                {q}
                <span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform text-xl">
                  expand_more
                </span>
              </summary>
              <p className="text-body-md text-on-surface-variant mt-3 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-label-sm text-outline pb-4">
          Smart Print Campus Utilities · Built by{" "}
          <span className="text-primary font-semibold">Soyal Binu Eapen</span> · 2026
        </p>
      </main>
    </div>
  );
}
