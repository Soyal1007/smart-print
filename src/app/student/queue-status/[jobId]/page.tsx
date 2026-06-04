"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { use } from "react";
import { getSession } from "@/app/actions/auth";

export default function PrintQueueStatusPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState("");
  const [queuePosition, setQueuePosition] = useState(1);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "">("");
  const prevStatusRef = useRef<string>("");
  const router = useRouter();
  const supabase = createClient();

  // ── Request notification permission on mount (client-only) ─────────────────
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestNotifPermission = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  const sendNotification = useCallback((title: string, body: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `smart-print-${jobId}`,   // prevents duplicate popups
    });
  }, [jobId]);

  // ── Fetch job + queue position ──────────────────────────────────────────────
  const fetchJob = useCallback(async () => {
    const user = await getSession();
    if (user) setUid(user.uid);

    const { data } = await supabase
      .from("print_jobs")
      .select("*, job_files(*)")
      .eq("id", jobId)
      .single();

    if (data) {
      // Detect status change → send notification
      if (prevStatusRef.current && prevStatusRef.current !== data.status) {
        if (data.status === "printed") {
          sendNotification(
            "📄 Your print is ready!",
            `Your document is ready for collection at the print shop.`
          );
        } else if (data.status === "printing") {
          sendNotification("🖨️ Printing started", "Your document is now being printed.");
        }
      }
      prevStatusRef.current = data.status;
      setJob(data);

      if (data.status === "printed" || data.status === "collected") {
        router.push(`/student/print-ready/${jobId}`);
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
  }, [jobId, sendNotification]);

  // ── Realtime subscription (Supabase postgres_changes) ─────────────────────
  useEffect(() => {
    fetchJob();

    const channel = supabase
      .channel(`job_status_${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "print_jobs", filter: `id=eq.${jobId}` },
        (payload) => {
          const newStatus = payload.new.status;
          const oldStatus = prevStatusRef.current;

          // Notifications on status change
          if (oldStatus && oldStatus !== newStatus) {
            if (newStatus === "printed") {
              sendNotification("📄 Your print is ready!", "Collect your document from the print shop.");
            } else if (newStatus === "printing") {
              sendNotification("🖨️ Printing started", "Your document is now printing.");
            }
          }
          prevStatusRef.current = newStatus;
          setJob(payload.new);

          if (newStatus === "printed" || newStatus === "collected") {
            setTimeout(() => router.push(`/student/print-ready/${jobId}`), 800);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Status step mapping ─────────────────────────────────────────────────────
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
      <header className="bg-surface shadow-sm fixed top-0 w-full h-16 z-50 flex justify-between items-center px-margin-mobile">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
            <img alt="Logo" className="w-8 h-8" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsEHpoti4k5kkt2DvR8XrLHW8iYIje5eMWO1V4mrZN53OnGmIQgrEsgD8I0TjgzjQt06qGqcnh0tlysm-JYE9A3xdQgd_lw9m05yZmjCLFl8b3F0VcyYbER2M2JABLAIi3jkwqLRbeVoHjZLteV5WeTsQcOpJ5_evBFr6I2cVK4oRRZL7QXvJT_OdhoRg32ybh2Ze7bSngTgDPJlf73Y2PbDVVD2RbEfuku72mJUVNXLvUCN3KGG56mryOLX6fxXr0WQlG71niBn8" />
          </div>
          <h1 className="text-title-md font-bold text-primary">Smart Print</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-label-md text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">UID: {uid}</span>
          {/* 🔔 Notification permission button */}
          {notifPermission !== "granted" && notifPermission !== "" && (
            <button
              onClick={requestNotifPermission}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-bold hover:opacity-80 transition-opacity"
              title="Enable notifications to get alerted when your print is ready"
            >
              <span className="material-symbols-outlined text-base">notifications</span>
              Notify me
            </button>
          )}
          {notifPermission === "granted" && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-tertiary-container/30 text-tertiary text-label-sm">
              <span className="material-symbols-outlined text-base">notifications_active</span>
              Alerts on
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow pt-24 pb-28 px-margin-mobile max-w-lg mx-auto w-full">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <span className="material-symbols-outlined animate-spin text-primary text-5xl">sync</span>
          </div>
        ) : (
          <>
            {/* Status Header Card */}
            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 mb-gutter relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 progress-shimmer"></div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-headline-lg-mobile text-primary mb-1">
                    {job?.status === "printing" ? "Printing in progress" :
                     job?.status === "queued"   ? "In Queue" :
                     job?.status === "printed"  ? "Print Ready!" : "Processing…"}
                  </h2>
                  <p className="text-body-md text-on-surface-variant">
                    {fileCount > 1 ? `${fileCount} files` : filename}
                  </p>
                </div>
                <button
                  className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center hover:bg-primary-container hover:text-on-primary transition-all active:scale-95 duration-150"
                  onClick={fetchJob}
                  title="Refresh now"
                >
                  <span className="material-symbols-outlined">refresh</span>
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                  <span className="text-label-sm text-on-surface-variant block mb-1">Queue Position</span>
                  <span className="text-headline-lg-mobile text-primary">#{queuePosition}</span>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                  <span className="text-label-sm text-on-surface-variant block mb-1">Estimated Wait</span>
                  <span className="text-headline-lg-mobile text-secondary">~{queuePosition * 2} min</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative pt-4 overflow-x-auto">
                <div className="flex items-start justify-between min-w-[400px] relative">
                  <div className="absolute top-5 left-0 w-full h-0.5 bg-outline-variant z-0"></div>
                  <div
                    className="absolute top-5 left-0 h-0.5 z-0 bg-primary transition-all duration-700"
                    style={{ width: `${Math.min(100, (statusStep / 4) * 100)}%` }}
                  ></div>
                  {[
                    { label: "Uploaded",  icon: "upload_file", step: 0 },
                    { label: "Paid",      icon: "payments",    step: 1 },
                    { label: "Printing",  icon: "print",       step: 2 },
                    { label: "Ready",     icon: "task_alt",    step: 3 },
                    { label: "Collected", icon: "inventory_2", step: 4 },
                  ].map((s, i) => (
                    <div key={i} className={`flex flex-col items-center gap-2 z-10 ${statusStep > s.step ? "step-complete" : statusStep === s.step ? "step-active" : "opacity-40"}`}>
                      <div className={`icon-container ${statusStep === s.step ? "w-12 h-12 -mt-1 ring-4 ring-primary-container/30 animate-pulse" : "w-10 h-10"} rounded-full flex items-center justify-center text-sm shadow-md transition-all`}>
                        <span className="material-symbols-outlined">
                          {statusStep > s.step ? "check" : s.icon}
                        </span>
                      </div>
                      <span className={`text-label-sm whitespace-nowrap ${statusStep === s.step ? "font-bold text-primary" : ""}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Live indicator */}
            <div className="flex items-center gap-2 mb-gutter px-1">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
              <span className="text-label-sm text-tertiary font-medium">Live — updates automatically when status changes</span>
            </div>

            {/* Notification prompt (if denied or default) */}
            {notifPermission === "default" && (
              <div className="bg-secondary-container/20 border border-secondary/20 rounded-xl p-4 mb-gutter flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
                <div className="flex-1">
                  <p className="text-label-md text-on-surface font-bold">Get notified when your print is ready</p>
                  <p className="text-label-sm text-on-surface-variant">We'll send a browser notification — no app needed</p>
                </div>
                <button
                  onClick={requestNotifPermission}
                  className="px-4 py-2 bg-secondary text-on-secondary rounded-full text-label-sm font-bold hover:opacity-90 flex-shrink-0"
                >
                  Allow
                </button>
              </div>
            )}

            {/* Printer Visual */}
            <section className="mb-gutter">
              <div className="bg-inverse-surface rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="w-24 h-24 mb-6 mx-auto bg-primary-container rounded-full flex items-center justify-center shadow-xl">
                    <span className={`material-symbols-outlined text-4xl text-on-primary-container ${job?.status === "printing" ? "animate-bounce" : ""}`}>
                      {job?.status === "printing" ? "print" : "schedule"}
                    </span>
                  </div>
                  <h3 className="text-headline-lg-mobile text-surface mb-2">Campus Hub Printer</h3>
                  <p className="text-body-md text-surface-variant/80">
                    {job?.status === "printing"
                      ? `Currently printing — ${job.total_pages} page${job.total_pages > 1 ? "s" : ""}`
                      : `Your job is queued — ${job?.total_pages || 0} pages`}
                  </p>
                  <div className="mt-6 w-full max-w-xs bg-surface-container/20 h-2 rounded-full overflow-hidden mx-auto">
                    <div
                      className="bg-tertiary-fixed-dim h-full rounded-full shadow-[0_0_10px_rgba(78,222,163,0.5)] transition-all duration-1000"
                      style={{ width: job?.status === "printing" ? "75%" : "25%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Help */}
            <div className="flex items-center gap-3 p-4 bg-surface-container-high/50 rounded-xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary">info</span>
              <p className="text-label-sm text-on-surface-variant">
                You'll be notified automatically when your document is ready. Collect from the print desk with your <strong>UID: {uid}</strong>.
              </p>
            </div>
          </>
        )}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-surface shadow-lg rounded-t-xl shadow-[0px_-4px_20px_rgba(0,0,0,0.05)]">
        <button onClick={() => router.push("/student/upload")} className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-1 hover:bg-surface-variant transition-all rounded-xl">
          <span className="material-symbols-outlined">cloud_upload</span>
          <span className="text-label-sm">Upload</span>
        </button>
        <button onClick={() => router.push("/student/dashboard")} className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-2xl px-6 py-1 scale-105">
          <span className="material-symbols-outlined active-nav-link">description</span>
          <span className="text-label-sm">My Prints</span>
        </button>
        <button onClick={() => router.push("/student/dashboard")} className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-1 hover:bg-surface-variant transition-all rounded-xl">
          <span className="material-symbols-outlined">person</span>
          <span className="text-label-sm">Profile</span>
        </button>
      </nav>
    </div>
  );
}
