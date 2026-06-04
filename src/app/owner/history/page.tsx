"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";
import Link from "next/link";

export default function OwnerHistory() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase
        .from("print_jobs")
        .select("*, job_files(*), profiles(uid, name)")
        .in("status", ["printed", "collected"])
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setJobs(data);
      setLoading(false);
    };
    init();
  }, []);

  const OwnerSidebar = () => (
    <aside className="fixed left-0 top-0 h-full flex flex-col py-6 bg-surface-container/90 backdrop-blur-md shadow-md w-80 rounded-r-xl z-30">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-on-primary">
          <span className="material-symbols-outlined text-3xl">print</span>
        </div>
        <div>
          <h1 className="text-headline-lg font-black text-primary leading-tight">Smart Print</h1>
          <p className="text-label-sm text-outline">Operator Suite</p>
        </div>
      </div>
      <nav className="flex-1 space-y-2">
        <Link href="/owner/dashboard" className="text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 flex items-center gap-4 transition-colors">
          <span className="material-symbols-outlined">queue_play_next</span>
          <span className="text-label-md">Active Queue</span>
        </Link>
        <Link href="/owner/history" className="bg-primary-container text-on-primary-container rounded-full mx-2 px-4 py-3 flex items-center gap-4 transition-all translate-x-1">
          <span className="material-symbols-outlined active-nav-link">history</span>
          <span className="text-label-md">Print History</span>
        </Link>
        <Link href="/owner/health" className="text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 flex items-center gap-4 transition-colors">
          <span className="material-symbols-outlined">monitor_heart</span>
          <span className="text-label-md">System Health</span>
        </Link>
        <Link href="/owner/settings" className="text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 flex items-center gap-4 transition-colors">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-label-md">Settings</span>
        </Link>
      </nav>
      <div className="mt-auto px-4">
        <div className="bg-surface-container-high rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-label-md font-bold truncate text-on-surface">Campus Center Hub</p>
            <p className="text-label-sm text-outline truncate">Operator Admin</p>
          </div>
        </div>
        <button onClick={async () => { await logout(); router.push("/login"); }}
          className="flex items-center gap-4 text-error font-bold text-label-md w-full p-3 mt-3 hover:bg-error-container/20 rounded-lg transition-colors">
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="bg-background text-on-background overflow-hidden h-screen flex" style={{ fontFamily: "'Geist', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      <OwnerSidebar />
      <main className="ml-80 flex-1 flex flex-col min-h-screen">
        <header className="flex justify-between items-center px-margin-desktop w-full h-16 bg-surface shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-title-md font-bold text-on-surface">Print History</h1>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
            <input className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-label-md w-64 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Search history..." type="text" />
          </div>
        </header>

        <div className="p-gutter overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <span className="material-symbols-outlined animate-spin text-primary text-5xl">sync</span>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-container-lowest z-10 border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-4 text-label-sm font-bold text-outline uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-label-sm font-bold text-outline uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-label-sm font-bold text-outline uppercase tracking-wider">File</th>
                    <th className="px-6 py-4 text-label-sm font-bold text-outline uppercase tracking-wider">Pages</th>
                    <th className="px-6 py-4 text-label-sm font-bold text-outline uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-label-sm font-bold text-outline uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {jobs.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-16 text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl block mb-2">history</span>
                      No completed jobs yet
                    </td></tr>
                  ) : jobs.map(job => (
                    <tr key={job.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-6 py-4 text-label-sm text-on-surface-variant">{new Date(job.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <p className="text-label-md font-bold text-on-surface">{job.profiles?.name || 'Student'}</p>
                        <p className="text-label-sm text-outline">UID: {job.profiles?.uid || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-label-md text-on-surface truncate max-w-[200px]">{job.job_files?.[0]?.original_filename || 'File'}</p>
                      </td>
                      <td className="px-6 py-4 text-label-md text-on-surface">{job.total_pages}</td>
                      <td className="px-6 py-4 font-bold text-on-surface">₹{((job.total_price_paise || 0) / 100).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-bold border ${job.status === 'collected' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
                          {job.status === 'collected' ? 'Collected' : 'Printed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="w-full py-4 px-margin-desktop flex justify-between items-center bg-surface border-t border-outline-variant">
          <span className="text-label-md font-bold text-on-surface">Smart Print Campus Utilities © 2024</span>
          <div className="flex gap-6">
            <a className="text-on-surface-variant text-label-sm hover:underline" href="#">Support</a>
            <a className="text-on-surface-variant text-label-sm hover:underline" href="#">Terms of Service</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
