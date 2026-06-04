"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { getSession, logout } from "@/app/actions/auth";

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  uploaded: { label: 'Uploaded', color: 'bg-surface-container text-on-surface-variant border-outline-variant/50', icon: 'cloud_upload' },
  paid: { label: 'Paid', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: 'payments' },
  queued: { label: 'Queued', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: 'queue' },
  printing: { label: 'Printing', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: 'print' },
  printed: { label: 'Ready!', color: 'bg-green-100 text-green-800 border-green-200', icon: 'task_alt' },
  collected: { label: 'Collected', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: 'inventory_2' },
};

export default function StudentDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const supabase = createClient();
  const router = useRouter();

  const fetchJobs = async () => {
    const user = await getSession();
    if (!user) { router.push("/login"); return; }
    setUid(user.uid);
    if (user.name) setName(user.name);

    const { data } = await supabase
      .from("print_jobs")
      .select("*, job_files(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const activeJobs = jobs.filter(j => ['uploaded', 'paid', 'queued', 'printing'].includes(j.status));
  const historyJobs = jobs.filter(j => ['printed', 'collected'].includes(j.status));
  const displayJobs = activeTab === 'active' ? activeJobs : historyJobs;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col" style={{ fontFamily: "'Geist', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      {/* TopAppBar */}
      <header className="bg-surface shadow-sm fixed top-0 w-full h-16 z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary overflow-hidden">
            <img alt="College Logo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyiu6s2JTPGnswZA1eR1JGMfYFFRlEI0zkrWreT3W4Q0WcScegQcPecqZeJNnTuWtuMb4N8IlmLMeU2wvhcDoTiG3r3-wJpdTVvKLSCUs4s6IrKEf3XFTWAH_g4JgH6Tk6YSTRWifxyHVo9-gF2OE_ObQID0cWOzKiaLYl8A1o4-d8G00AW8h0wDUbwpF5ucQXkMpEakHjVyMapGYMx_UCaT-e-ClojZddPe0VcYcnYUvHawp0A5aB7bUHPikPAHkd2DkPd_kbsTI" />
          </div>
          <span className="text-title-md font-bold text-primary">Smart Print</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-label-md text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">
            {name || uid}
          </span>
          <button onClick={async () => { await logout(); router.push("/login"); }} className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer">logout</button>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-28 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
        {/* Header */}
        <section className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-headline-lg-mobile md:text-headline-lg text-primary">My Print Jobs</h1>
            <p className="text-body-md text-on-surface-variant">Track status and history of your prints</p>
          </div>
          <button
            onClick={() => router.push("/student/upload")}
            className="bg-primary text-on-primary px-6 py-3 rounded-full text-label-md flex items-center gap-2 hover:shadow-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            New Print Job
          </button>
        </section>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-surface-container-low p-1 rounded-full w-fit">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-6 py-2 rounded-full text-label-md transition-all ${activeTab === 'active' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
          >
            Active ({activeJobs.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2 rounded-full text-label-md transition-all ${activeTab === 'history' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
          >
            History ({historyJobs.length})
          </button>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="material-symbols-outlined animate-spin text-primary text-5xl">sync</span>
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant/50">
            <span className="material-symbols-outlined text-6xl mb-4">description</span>
            <p className="text-title-md">{activeTab === 'active' ? 'No active print jobs' : 'No print history yet'}</p>
            <button onClick={() => router.push("/student/upload")} className="mt-6 bg-primary text-on-primary px-6 py-3 rounded-full text-label-md hover:shadow-md transition-all">
              Upload a Document
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {displayJobs.map(job => {
              const cfg = statusConfig[job.status] || statusConfig.uploaded;
              const file = job.job_files?.[0];
              return (
                <div key={job.id} className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-6 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-on-primary-container">{file?.original_filename?.endsWith('.pdf') ? 'picture_as_pdf' : 'description'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-label-md font-bold text-on-surface truncate">{file?.original_filename || 'Document'}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-label-sm text-on-surface-variant">{job.total_pages} Pages</span>
                          <span className="text-label-sm text-outline">•</span>
                          <span className="text-label-sm text-on-surface-variant">{file?.color_mode === 'color' ? 'Color' : 'B&W'}</span>
                          <span className="text-label-sm text-outline">•</span>
                          <span className="text-label-sm text-on-surface-variant">{file?.sides === 'double' ? 'Double' : 'Single'} Side</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-headline-lg-mobile text-primary font-bold">₹{((job.total_price_paise || 0) / 100).toFixed(2)}</span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-bold border ${cfg.color}`}>
                            <span className={`w-2 h-2 rounded-full ${job.status === 'printing' ? 'animate-pulse bg-yellow-500' : 'hidden'}`}></span>
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {job.status === 'uploaded' && (
                        <button onClick={() => router.push(`/student/preview/${job.id}`)} className="px-4 py-2 rounded-lg border border-primary text-primary text-label-sm font-bold hover:bg-primary/5 transition-colors">
                          Preview & Pay
                        </button>
                      )}
                      {(job.status === 'queued' || job.status === 'printing') && (
                        <button onClick={() => router.push(`/student/queue-status/${job.id}`)} className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-sm font-bold hover:bg-primary-container transition-colors">
                          Track Status
                        </button>
                      )}
                      {job.status === 'printed' && (
                        <button onClick={() => router.push(`/student/print-ready/${job.id}`)} className="px-4 py-2 rounded-lg bg-tertiary text-on-tertiary text-label-sm font-bold hover:opacity-90 transition-opacity">
                          Ready to Collect!
                        </button>
                      )}
                      {job.status === 'paid' && (
                        <button onClick={() => router.push(`/student/queue-status/${job.id}`)} className="px-4 py-2 rounded-lg bg-secondary text-on-secondary text-label-sm font-bold hover:opacity-90 transition-opacity">
                          View Queue
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-surface-container-lowest shadow-[0px_-4px_20px_rgba(0,0,0,0.05)] rounded-t-xl">
        <button onClick={() => router.push("/student/upload")} className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-1 hover:bg-surface-variant transition-all rounded-xl">
          <span className="material-symbols-outlined">cloud_upload</span>
          <span className="text-label-sm">Upload</span>
        </button>
        <div className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-2xl px-6 py-1 scale-105">
          <span className="material-symbols-outlined active-nav-link">description</span>
          <span className="text-label-sm">My Prints</span>
        </div>
        <button onClick={() => router.push("/student/dashboard")} className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-1 hover:bg-surface-variant transition-all rounded-xl">
          <span className="material-symbols-outlined">person</span>
          <span className="text-label-sm">Profile</span>
        </button>
      </nav>

      {/* Footer (Desktop) */}
      <footer className="hidden md:flex w-full py-unit px-margin-desktop bg-surface border-t border-outline-variant justify-between items-center mb-20">
        <span className="text-label-md font-bold text-on-surface">© 2024 Smart Print Campus Utilities</span>
        <div className="flex gap-6">
          <a className="text-label-sm text-on-surface-variant hover:underline decoration-2 underline-offset-4" href="#">Support</a>
          <a className="text-label-sm text-on-surface-variant hover:underline decoration-2 underline-offset-4" href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
