"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { use } from "react";
import { getSession } from "@/app/actions/auth";
import { useToast } from "@/components/Toast";

export default function PrintQueueStatusPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState("");
  const [queuePosition, setQueuePosition] = useState(1);
  const prevStatusRef = useRef<string>("");
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  // ── Browser notification (desktop only) ────────────────────────────────────
  const sendBrowserNotif = useCallback((title: string, body: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico", tag: `smart-print-${jobId}` });
    }
  }, [jobId]);

  // ── Fetch job ───────────────────────────────────────────────────────────────
  const fetchJob = useCallback(async () => {
    const user = await getSession();
    if (user) setUid(user.uid);

    const { data } = await supabase
      .from("print_jobs")
      .select("*, job_files(*)")
      .eq("id", jobId)
      .single();

    if (data) {
      const newStatus = data.status;
      const oldStatus = prevStatusRef.current;

      if (oldStatus && oldStatus !== newStatus) {
        if (newStatus === "printing") {
          showToast("info", "🖨️ Printing started", "Your document is now being printed.");
          sendBrowserNotif("🖨️ Printing started", "Your document is now being printed.");
        }
        if (newStatus === "printed") {
          showToast("success", "📄 Print is ready!", "Come collect your document from the print desk.");
          sendBrowserNotif("📄 Print is ready!", "Come collect from the print desk.");
        }
      }

      prevStatusRef.current = newStatus;
      setJob(data);

      if (newStatus === "printed" || newStatus === "collected") {
        setTimeout(() => router.push(`/student/print-ready/${jobId}`), 1000);
      }
    }

    // Queue position
    const { data: queueData } = await supabase
      .from("print_jobs")
      .select("id")
      .in("status", ["queued", "printing"])
      .order("created_at", { ascending: true });
    if (queueData) {
      const pos = queueData.findIndex(j => j.id === jobId) + 1;
      setQueuePosition(pos > 0 ? pos : 1);
    }

    setLoading(false);
  }, [jobId, showToast, sendBrowserNotif]);

  // ── Realtime + aggressive polling (works on mobile) ────────────────────────
  useEffect(() => {
    fetchJob();

    // Supabase realtime — instant on desktop
    const channel = supabase
      .channel(`queue_${jobId}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "print_jobs", filter: `id=eq.${jobId}` },
        () => fetchJob()  // re-fetch on any update
      )
      .subscribe();

    // Poll every 4s — guarantees mobile gets updates
    const poll = setInterval(fetchJob, 4000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const requestNotifPermission = async () => {
    if (!("Notification" in window)) {
      showToast("info", "Not supported", "Browser notifications aren't supported on this device.");
      return;
    }
    const result = await Notification.requestPermission();
    if (result === "granted") showToast("success", "Notifications enabled", "You'll be alerted when your print is ready.");
    else showToast("warning", "Notifications blocked", "We'll still show in-app alerts.");
  };

  const [notifGranted, setNotifGranted] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifGranted(Notification.permission === "granted");
    }
  }, []);

  const getStatusStep = (status: string) => {
    switch (status) {
      case "uploaded":         return 0;
      case "awaiting_payment": return 1;
      case "paid":             return 1;
      case "queued":           return 1;
      case "printing":         return 2;
      case "printed":          return 3;
      case "collected":        return 4;
      default:                 return 0;
    }
  };

  const statusStep = getStatusStep(job?.status || "printing");
  const filename = job?.job_files?.[0]?.original_filename || "Document";
  const fileCount = job?.job_files?.length || 1;

  return (
    <div
      className="bg-background text-on-background min-h-screen flex flex-col"
      style={{ fontFamily: "'Geist', sans-serif", WebkitFontSmoothing: "antialiased" }}
    >
      {/* TopAppBar */}
      <header className="bg-surface shadow-sm fixed top-0 w-full h-16 z-50 flex justify-between items-center px-4 md:px-margin-mobile">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
            <img alt="Logo" className="w-8 h-8" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsEHpoti4k5kkt2DvR8XrLHW8iYIje5eMWO1V4mrZN53OnGmIQgrEsgD8I0TjgzjQt06qGqcnh0tlysm-JYE9A3xdQgd_lw9m05yZmjCLFl8b3F0VcyYbER2M2JABLAIi3jkwqLRbeVoHjZLteV5WeTsQcOpJ5_evBFr6I2cVK4oRRZL7QXvJT_OdhoRg32ybh2Ze7bSngTgDPJlf73Y2PbDVVD2RbEfuku72mJUVNXLvUCN3KGG56mryOLX6fxXr0WQlG71niBn8" />
          </div>
          <h1 className="text-title-md font-bold text-primary">Smart Print</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-label-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">UID: {uid}</span>
          {!notifGranted && (
            <button
              onClick={requestNotifPermission}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-bold hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined text-base">notifications</span>
              <span className="hidden sm:inline">Notify me</span>
            </button>
          )}
          {notifGranted && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-tertiary-container/30 text-tertiary text-label-sm">
              <span className="material-symbols-outlined text-base">notifications_active</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow pt-24 pb-28 px-4 md:px-margin-mobile max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 gap-4">
            <span className="material-symbols-outlined animate-spin text-primary text-5xl">sync</span>
            <p className="text-on-surface-variant text-label-md">Loading your print status…</p>
          </div>
        ) : (
          <>
            {/* Status Card */}
            <section className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 mb-4">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="text-title-lg font-bold text-primary mb-1">
                    {job?.status === "printing" ? "Printing now…" :
                     job?.status === "queued"   ? "In queue" :
                     job?.status === "printed"  ? "Ready to collect!" : "Processing…"}
                  </h2>
                  <p className="text-body-sm text-on-surface-variant truncate max-w-[200px]">
                    {fileCount > 1 ? `${fileCount} files` : filename}
                  </p>
                </div>
                <button onClick={fetchJob} className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center hover:bg-primary-container hover:text-on-primary transition-all" title="Refresh">
                  <span className="material-symbols-outlined text-lg">refresh</span>
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-surface-container p-4 rounded-xl">
                  <span className="text-label-sm text-on-surface-variant block mb-1">Queue Position</span>
                  <span className="text-headline-lg-mobile text-primary font-bold">#{queuePosition}</span>
                </div>
                <div className="bg-surface-container p-4 rounded-xl">
                  <span className="text-label-sm text-on-surface-variant block mb-1">Est. Wait</span>
                  <span className="text-headline-lg-mobile text-secondary font-bold">~{queuePosition * 2}m</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="overflow-x-auto pb-2">
                <div className="flex items-start justify-between min-w-[360px] relative pt-2">
                  <div className="absolute top-7 left-0 w-full h-0.5 bg-outline-variant"></div>
                  <div className="absolute top-7 left-0 h-0.5 bg-primary transition-all duration-700" style={{ width: `${Math.min(100, (statusStep / 4) * 100)}%` }}></div>
                  {[
                    { label: "Uploaded",  icon: "upload_file", step: 0 },
                    { label: "Paid",      icon: "payments",    step: 1 },
                    { label: "Printing",  icon: "print",       step: 2 },
                    { label: "Ready",     icon: "task_alt",    step: 3 },
                    { label: "Collected", icon: "inventory_2", step: 4 },
                  ].map((s) => (
                    <div key={s.step} className={`flex flex-col items-center gap-2 z-10 ${statusStep < s.step ? "opacity-40" : ""}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all
                        ${statusStep > s.step  ? "bg-primary text-on-primary" :
                          statusStep === s.step ? "bg-primary-container text-on-primary-container ring-4 ring-primary/20" :
                          "bg-surface-container text-on-surface-variant"}`}>
                        <span className="material-symbols-outlined text-lg">{statusStep > s.step ? "check" : s.icon}</span>
                      </div>
                      <span className={`text-[10px] whitespace-nowrap ${statusStep === s.step ? "font-bold text-primary" : "text-on-surface-variant"}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Live indicator */}
            <div className="flex items-center gap-2 mb-4 px-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-label-sm text-on-surface-variant">Live — updates every 4 seconds</span>
            </div>

            {/* Printer Visual */}
            <section className="bg-inverse-surface rounded-2xl p-8 flex flex-col items-center text-center mb-4">
              <div className="w-20 h-20 mb-4 bg-primary-container rounded-full flex items-center justify-center shadow-xl">
                <span className={`material-symbols-outlined text-3xl text-on-primary-container ${job?.status === "printing" ? "animate-bounce" : ""}`}>
                  {job?.status === "printing" ? "print" : "schedule"}
                </span>
              </div>
              <h3 className="text-title-md text-surface font-bold mb-1">Campus Hub Printer</h3>
              <p className="text-sm text-surface-variant/80">
                {job?.status === "printing" ? `Printing — ${job.total_pages} pages` : `Queued — ${job?.total_pages || 0} pages`}
              </p>
              <div className="mt-4 w-full max-w-xs bg-surface-container/20 h-1.5 rounded-full overflow-hidden">
                <div className="bg-tertiary-fixed-dim h-full rounded-full transition-all duration-1000"
                  style={{ width: job?.status === "printing" ? "75%" : "25%" }}></div>
              </div>
            </section>

            {/* Collection info */}
            <div className="flex items-start gap-3 p-4 bg-surface-container rounded-xl">
              <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
              <p className="text-label-sm text-on-surface-variant">
                You'll get an alert here (and a browser notification on desktop) when your document is ready.
                Collect with <strong>UID: {uid}</strong>.
              </p>
            </div>
          </>
        )}
      </main>

      {/* BottomNav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-safe pt-2 bg-surface shadow-lg rounded-t-2xl border-t border-outline-variant/30">
        <button onClick={() => router.push("/student/upload")} className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2">
          <span className="material-symbols-outlined">cloud_upload</span>
          <span className="text-label-sm">Upload</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-2xl px-6 py-2">
          <span className="material-symbols-outlined">description</span>
          <span className="text-label-sm font-bold">Status</span>
        </button>
        <button onClick={() => router.push("/student/dashboard")} className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-2">
          <span className="material-symbols-outlined">person</span>
          <span className="text-label-sm">Profile</span>
        </button>
      </nav>
    </div>
  );
}
