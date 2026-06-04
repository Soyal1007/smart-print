"use client";

import { useState, useEffect, Fragment, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function OwnerDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todayRevenue: 0, todayJobs: 0, totalPages: 0, queueCount: 0 });
  const [search, setSearch] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [offlineMsg, setOfflineMsg] = useState("The print shop is currently closed.");
  const [togglingShop, setTogglingShop] = useState(false);
  const [previewJob, setPreviewJob] = useState<any | null>(null);
  const [previewUrls, setPreviewUrls] = useState<{ name: string; url: string; type: string }[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);
  const prevJobCountRef = useRef<number>(-1);
  const supabase = createClient();
  const router = useRouter();
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    const { data: queueData } = await supabase
      .from("print_jobs")
      .select("*, job_files(*), profiles(uid, name)")
      .in("status", ["queued", "printing", "printed", "paid"])
      .order("created_at", { ascending: true });

    if (queueData) {
      // Alert on new job arrival
      const newCount = queueData.filter(j => ['queued', 'paid', 'printing'].includes(j.status)).length;
      if (prevJobCountRef.current >= 0 && newCount > prevJobCountRef.current) {
        const diff = newCount - prevJobCountRef.current;
        showToast("info", `🖨️ New job${diff > 1 ? 's' : ''} arrived!`,
          `${diff} new print ${diff > 1 ? 'jobs' : 'job'} added to the queue.`);
      }
      prevJobCountRef.current = newCount;
      setJobs(queueData);
      setLastUpdated(new Date().toLocaleTimeString());
    }

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

    // Fetch shop status
    const { data: shopData } = await supabase.from("shop_settings").select("*").eq("id", 1).single();
    if (shopData) { setIsShopOpen(shopData.is_open); setOfflineMsg(shopData.offline_message); }

    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('owner_queue_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'print_jobs' }, () => fetchData())
      .subscribe();
    const poll = setInterval(fetchData, 8000);
    return () => { supabase.removeChannel(channel); clearInterval(poll); };
  }, [fetchData]);

  const toggleShop = async () => {
    setTogglingShop(true);
    const newState = !isShopOpen;
    await supabase.from("shop_settings").update({ is_open: newState, updated_at: new Date().toISOString() }).eq("id", 1);
    setIsShopOpen(newState);
    showToast(newState ? "success" : "warning",
      newState ? "Shop is now OPEN" : "Shop marked as CLOSED",
      newState ? "Students can now submit print jobs." : "No new jobs can be submitted until reopened.");
    setTogglingShop(false);
  };

  const openPreview = async (job: any) => {
    setPreviewJob(job);
    setPreviewUrls([]);
    setActivePreviewIdx(0);
    setPreviewLoading(true);
    const urls: { name: string; url: string; type: string }[] = [];
    for (const f of (job.job_files || [])) {
      const path = f.storage_path || f.file_path;
      if (!path) continue;
      const { data } = await supabase.storage.from("orders").createSignedUrl(path, 300);
      if (data?.signedUrl) {
        const isImg = /\.(png|jpg|jpeg|gif|webp)$/i.test(f.original_filename || "");
        urls.push({ name: f.original_filename, url: data.signedUrl, type: isImg ? "image" : "pdf" });
      }
    }
    setPreviewUrls(urls);
    setPreviewLoading(false);
  };

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
          {/* Shop Status Toggle — fixed visual */}
          <div className={`rounded-2xl p-4 mb-3 border-2 transition-all duration-300 ${
            isShopOpen ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/40'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  isShopOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></span>
                <span className="text-label-sm font-bold text-on-surface">
                  Shop: {isShopOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
              {/* Toggle — track w-12(48px) h-6(24px), thumb w-4(16px) h-4(16px) */}
              <button
                onClick={toggleShop}
                disabled={togglingShop}
                aria-label="Toggle shop open/closed"
                className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0 focus:outline-none ${
                  isShopOpen ? 'bg-green-500' : 'bg-red-400'
                } ${togglingShop ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
                  isShopOpen ? 'left-7' : 'left-1'
                }`}></span>
              </button>
            </div>
            <p className="text-label-sm text-on-surface-variant">
              {isShopOpen ? 'Toggle off to close for holidays' : 'Students see a closed banner'}
            </p>
          </div>
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
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              isShopOpen
                ? 'bg-tertiary-container/10 text-tertiary-container'
                : 'bg-error-container/20 text-error'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isShopOpen ? 'bg-tertiary-fixed animate-pulse' : 'bg-error'
              }`}></span>
              <span className="text-label-sm font-bold">
                {isShopOpen ? 'Printer Status: Online' : 'Shop: CLOSED'}
              </span>
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
                      <Fragment key={job.id}>
                        <tr
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
                              <button
                                onClick={() => openPreview(job)}
                                className="p-2 rounded-full hover:bg-primary-container text-primary transition-colors"
                                title="Preview documents"
                              >
                                <span className="material-symbols-outlined">preview</span>
                              </button>
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
                      </Fragment>
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

      {/* ── Preview Modal ─────────────────────────────────────────────────── */}
      {previewJob && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewJob(null)}
        >
          <div
            className="bg-surface rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
              <div>
                <p className="text-label-sm text-outline">Previewing job for</p>
                <h3 className="text-title-md font-bold text-on-surface">{previewJob.profiles?.name} · UID: {previewJob.profiles?.uid}</h3>
              </div>
              <button onClick={() => setPreviewJob(null)} className="w-9 h-9 rounded-full hover:bg-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* File tabs */}
            {previewUrls.length > 1 && (
              <div className="flex gap-2 px-6 pt-3 overflow-x-auto">
                {previewUrls.map((f, i) => (
                  <button key={i} onClick={() => setActivePreviewIdx(i)}
                    className={`px-4 py-1.5 rounded-full text-label-sm font-bold whitespace-nowrap transition-colors
                      ${activePreviewIdx === i ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'}`}>
                    File {i + 1}: {f.name.length > 20 ? f.name.slice(0, 20) + '…' : f.name}
                  </button>
                ))}
              </div>
            )}

            {/* Preview area */}
            <div className="flex-1 overflow-hidden p-4">
              {previewLoading ? (
                <div className="flex justify-center items-center h-full">
                  <span className="material-symbols-outlined animate-spin text-primary text-5xl">sync</span>
                </div>
              ) : previewUrls.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-on-surface-variant gap-2">
                  <span className="material-symbols-outlined text-5xl">broken_image</span>
                  <p>No preview available</p>
                </div>
              ) : (
                <>
                  {previewUrls[activePreviewIdx]?.type === "image" ? (
                    <img
                      src={previewUrls[activePreviewIdx].url}
                      alt="Preview"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <iframe
                      src={previewUrls[activePreviewIdx]?.url}
                      className="w-full h-[60vh] rounded-xl border border-outline-variant"
                      title="PDF Preview"
                    />
                  )}
                  {/* UID watermark info */}
                  <p className="text-label-sm text-outline text-center mt-2">
                    UID watermark: {previewJob.profiles?.uid} · {previewJob.total_pages} pages · ₹{((previewJob.total_price_paise || 0) / 100).toFixed(2)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
