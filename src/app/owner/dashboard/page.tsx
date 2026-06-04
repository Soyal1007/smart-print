"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";
import Link from "next/link";

export default function OwnerDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todayRevenue: 0, todayJobs: 0, totalPages: 0, queueCount: 0 });
  const [search, setSearch] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(""); // empty until client mounts — avoids hydration mismatch
  const supabase = createClient();
  const router = useRouter();

  const fetchData = async () => {
    const { data: queueData } = await supabase
      .from("print_jobs")
      .select("*, job_files(*), profiles(uid, name)")
      .in("status", ["queued", "printing", "printed", "paid"])
      .order("created_at", { ascending: true });
    if (queueData) { setJobs(queueData); setLastUpdated(new Date().toLocaleTimeString()); }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: statsData } = await supabase
      .from("print_jobs")
      .select("total_price_paise, total_pages")
      .gte("created_at", today.toISOString())
      .not("status", "eq", "uploaded");
    if (statsData) {
      setStats({
        todayRevenue: statsData.reduce((a, c) => a + (c.total_price_paise || 0), 0),
        todayJobs: statsData.length,
        totalPages: statsData.reduce((a, c) => a + (c.total_pages || 0), 0),
        queueCount: (queueData || []).filter(j => ['queued', 'printing', 'paid'].includes(j.status)).length,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('owner_queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'print_jobs' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleMarkCollected = async (jobId: string) => {
    await supabase.from("print_jobs").update({ status: "collected" }).eq("id", jobId);
    fetchData();
  };

  const handleStartJob = async (jobId: string) => {
    await supabase.from("print_jobs").update({ status: "printing" }).eq("id", jobId);
    fetchData();
  };

  const handleMarkPrinted = async (jobId: string) => {
    await supabase.from("print_jobs").update({ status: "printed" }).eq("id", jobId);
    fetchData();
  };

  const filteredJobs = jobs.filter(j => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (j.profiles?.uid || '').includes(s) ||
      (j.profiles?.name || '').toLowerCase().includes(s) ||
      (j.job_files?.[0]?.original_filename || '').toLowerCase().includes(s);
  });

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'printing': return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-label-sm font-bold border border-yellow-200"><span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>Printing</div>;
      case 'queued': return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-label-sm font-bold border border-orange-200">Queued</div>;
      case 'paid': return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-label-sm font-bold border border-purple-200">Paid</div>;
      case 'printed': return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-label-sm font-bold border border-green-200">Printed</div>;
      default: return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-label-sm font-bold border border-gray-200">{status}</div>;
    }
  };

  return (
    <div className="bg-background text-on-background overflow-hidden h-screen flex" style={{ fontFamily: "'Geist', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      {/* NavigationDrawer */}
      <aside className="fixed left-0 top-0 h-full flex flex-col py-6 bg-surface-container/90 backdrop-blur-md shadow-md w-80 rounded-r-xl z-30 transition-all duration-300">
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
          <Link href="/owner/dashboard" className="bg-primary-container text-on-primary-container rounded-full mx-2 px-4 py-3 flex items-center gap-4 transition-all translate-x-1 duration-200">
            <span className="material-symbols-outlined active-nav-link">queue_play_next</span>
            <span className="text-label-md">Active Queue</span>
          </Link>
          <Link href="/owner/history" className="text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 flex items-center gap-4 transition-colors">
            <span className="material-symbols-outlined">history</span>
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
          <Link href="#" className="text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 flex items-center gap-4 transition-colors">
            <span className="material-symbols-outlined">help</span>
            <span className="text-label-md">Support</span>
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

      {/* Main Content */}
      <main className="ml-80 flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* TopAppBar */}
        <header className="flex justify-between items-center px-margin-desktop w-full h-16 bg-surface shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <img alt="College Logo" className="h-10 w-10 object-contain rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyiu6s2JTPGnswZA1eR1JGMfYFFRlEI0zkrWreT3W4Q0WcScegQcPecqZeJNnTuWtuMb4N8IlmLMeU2wvhcDoTiG3r3-wJpdTVvKLSCUs4s6IrKEf3XFTWAH_g4JgH6Tk6YSTRWifxyHVo9-gF2OE_ObQID0cWOzKiaLYl8A1o4-d8G00AW8h0wDUbwpF5ucQXkMpEakHjVyMapGYMx_UCaT-e-ClojZddPe0VcYcnYUvHawp0A5aB7bUHPikPAHkd2DkPd_kbsTI" />
            <div className="h-6 w-[1px] bg-outline-variant"></div>
            <div className="flex items-center gap-2 px-3 py-1 bg-tertiary-container/10 text-tertiary-container rounded-full">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
              <span className="text-label-sm font-bold">Printer Status: Online</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
              <input
                className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-label-md w-64 focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Search UID or Document..."
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="text-right">
              <span className="text-label-sm text-outline">Operator ID</span>
              <p className="text-label-md font-bold text-primary">ADMIN</p>
            </div>
          </div>
        </header>

        <div className="p-gutter overflow-y-auto flex-1 space-y-gutter">
          {/* Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
            {[
              { label: 'Orders Today', value: stats.todayJobs.toString(), icon: 'receipt_long', color: 'text-primary', sub: 'Total print jobs' },
              { label: 'Pages Printed', value: stats.totalPages.toString(), icon: 'description', color: 'text-secondary', sub: 'Today\'s volume' },
              { label: 'Revenue (INR)', value: `₹${(stats.todayRevenue / 100).toFixed(0)}`, icon: 'payments', color: 'text-tertiary', sub: 'Today\'s earnings' },
              { label: 'Active Queue', value: stats.queueCount.toString().padStart(2, '0'), icon: 'sync', color: 'text-primary', sub: 'Pending jobs', ring: true },
            ].map((s, i) => (
              <div key={i} className={`bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-2 hover:shadow-md transition-shadow group ${s.ring ? 'ring-2 ring-primary/10' : ''}`}>
                <div className="flex justify-between items-start">
                  <span className={`text-label-md ${s.ring ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>{s.label}</span>
                  <span className={`material-symbols-outlined ${s.color} group-hover:scale-110 transition-transform`} style={i === 3 ? { animationDuration: '3s' } : {}}>{s.icon}</span>
                </div>
                <p className={`text-headline-lg font-bold ${s.ring ? 'text-primary' : 'text-on-surface'}`}>{s.value}</p>
                <div className="flex items-center gap-1 text-outline text-label-sm">
                  <span>{s.sub}</span>
                </div>
              </div>
            ))}
          </section>

          {/* Queue Table */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 340px)' }}>
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
              <h2 className="text-title-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined">view_list</span>
                Live Printing Queue
              </h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-full bg-surface-variant text-primary text-label-md font-bold hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">filter_list</span>
                  Filter
                </button>
                <button onClick={fetchData} className="px-4 py-2 rounded-full bg-primary text-on-primary text-label-md font-bold shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Force Refresh
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <span className="material-symbols-outlined animate-spin text-primary text-5xl">sync</span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface-container-lowest z-10 border-b border-outline-variant shadow-sm">
                    <tr>
                      <th className="px-6 py-4 text-label-sm font-bold text-outline uppercase tracking-wider">Queue Pos</th>
                      <th className="px-6 py-4 text-label-sm font-bold text-outline uppercase tracking-wider">Student Details</th>
                      <th className="px-6 py-4 text-label-sm font-bold text-outline uppercase tracking-wider">File Metadata</th>
                      <th className="px-6 py-4 text-label-sm font-bold text-outline uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-label-sm font-bold text-outline uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-label-sm font-bold text-outline uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-label-sm font-bold text-outline uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-on-surface-variant">
                          <span className="material-symbols-outlined text-4xl block mb-2">check_circle</span>
                          Queue is empty — all caught up!
                        </td>
                      </tr>
                    ) : filteredJobs.map((job, i) => (
                      <>
                        <tr
                          key={job.id}
                          className={`hover:bg-surface-container-low/40 transition-colors cursor-pointer ${selectedJobId === job.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                          onClick={() => setSelectedJobId(selectedJobId === job.id ? null : job.id)}
                        >
                          <td className="px-6 py-4">
                            <span className={`w-8 h-8 rounded-full ${job.status === 'printing' ? 'bg-primary-container text-on-primary-container animate-pulse' : 'bg-surface-variant text-on-surface-variant'} flex items-center justify-center font-bold text-label-md`}>
                              #{i + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-label-md font-bold text-on-surface">{job.profiles?.name || 'Student'}</p>
                            <p className="text-label-sm text-outline">UID: {job.profiles?.uid || '—'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-xl">picture_as_pdf</span>
                              <div>
                                <p className="text-label-md font-medium text-on-surface truncate max-w-[150px]">
                                  {job.job_files?.length > 1 ? `${job.job_files.length} files` : (job.job_files?.[0]?.original_filename || 'File')}
                                </p>
                                <p className="text-label-sm text-outline">{job.total_pages} total pages</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${job.job_files?.[0]?.color_mode === 'color' ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'bg-outline-variant text-on-surface-variant'}`}>
                              {job.job_files?.[0]?.color_mode === 'color' ? 'Color' : 'B&W'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-on-surface">₹{((job.total_price_paise || 0) / 100).toFixed(2)}</td>
                          <td className="px-6 py-4">{getStatusChip(job.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                              {(job.status === 'queued' || job.status === 'paid') ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-label-sm font-bold border border-orange-200">
                                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                  Queued
                                </div>
                              ) : job.status === 'printing' ? (
                                <button onClick={() => handleMarkPrinted(job.id)} className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary text-label-sm font-bold hover:opacity-90 transition-opacity">
                                  Mark Printed
                                </button>
                              ) : job.status === 'printed' ? (
                                <button onClick={() => handleMarkCollected(job.id)} className="px-3 py-1.5 rounded-lg bg-tertiary text-on-tertiary text-label-sm font-bold hover:opacity-90 transition-opacity">
                                  Mark Collected
                                </button>
                              ) : null}
                              <button className="p-2 rounded-full hover:bg-surface-variant text-outline transition-colors">
                                <span className="material-symbols-outlined">{selectedJobId === job.id ? 'expand_less' : 'expand_more'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {/* ── Expanded detail row ── */}
                        {selectedJobId === job.id && (
                          <tr key={`${job.id}-detail`} className="bg-primary/3">
                            <td colSpan={7} className="px-8 py-4">
                              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/40">
                                <p className="text-label-md font-bold text-primary mb-3 flex items-center gap-2">
                                  <span className="material-symbols-outlined text-base">print</span>
                                  Print Job Details — {job.profiles?.name} (UID: {job.profiles?.uid})
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {(job.job_files || []).map((f: any, fi: number) => (
                                    <div key={f.id} className="bg-surface rounded-xl p-3 border border-outline-variant/30 flex items-start gap-3">
                                      <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-on-primary-container text-base">description</span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-label-md font-bold text-on-surface truncate">File {fi + 1}: {f.original_filename}</p>
                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                                          <span className="text-label-sm text-outline">{f.page_count || '?'} pages</span>
                                          <span className="text-label-sm text-outline">·</span>
                                          <span className="text-label-sm text-outline">{f.color_mode === 'color' ? '🎨 Color' : '⬛ B&W'}</span>
                                          <span className="text-label-sm text-outline">·</span>
                                          <span className="text-label-sm text-outline">{f.sides === 'double' ? 'Double-sided' : 'Single-sided'}</span>
                                          <span className="text-label-sm text-outline">·</span>
                                          <span className="text-label-sm text-outline">{f.copies || 1} {f.copies > 1 ? 'copies' : 'copy'}</span>
                                          {f.page_range && f.page_range !== 'all' && (
                                            <><span className="text-label-sm text-outline">·</span>
                                            <span className="text-label-sm text-outline">Pages: {f.page_range}</span></>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-outline-variant/30 flex justify-between items-center">
                                  <span className="text-label-sm text-outline">
                                    Ordered: {new Date(job.created_at).toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-label-md font-bold text-primary">
                                    Total: ₹{((job.total_price_paise || 0) / 100).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-3 border-t border-outline-variant bg-surface flex justify-between items-center">
              <p className="text-label-sm text-outline">
                Showing {filteredJobs.length} active jobs{lastUpdated ? ` · Updated: ${lastUpdated}` : ""}
                <span className="ml-2 inline-flex items-center gap-1 text-tertiary"><span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse inline-block"></span>Live</span>
              </p>
              <div className="flex items-center gap-4">
                <span className="text-label-sm text-outline">Rows per page:</span>
                <select className="bg-transparent border-none text-label-sm font-bold focus:ring-0">
                  <option>10</option><option>25</option><option>50</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="w-full py-4 px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4 bg-surface border-t border-outline-variant">
          <div className="flex items-center gap-4">
            <span className="text-label-md font-bold text-on-surface">Smart Print Campus Utilities</span>
            <span className="text-label-sm text-outline">© 2026 · Built by <span className="text-primary font-medium">Soyal Binu Eapen</span></span>
          </div>
          <div className="flex gap-6">
            <a className="text-on-surface-variant text-label-sm hover:underline decoration-2 underline-offset-4" href="#">Support</a>
            <a className="text-on-surface-variant text-label-sm hover:underline decoration-2 underline-offset-4" href="#">Print History</a>
            <a className="text-on-surface-variant text-label-sm hover:underline decoration-2 underline-offset-4" href="#">Terms of Service</a>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
            <span className="text-label-sm font-medium text-tertiary">Server Connection Stable</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
