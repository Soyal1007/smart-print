"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";
import Link from "next/link";

export default function OwnerSettings() {
  const [shopData, setShopData] = useState<any>(null);
  const [shopId, setShopId] = useState<string>("");
  const [bwPrice, setBwPrice] = useState("2");
  const [colorPrice, setColorPrice] = useState("10");
  const [doubleSurcharge, setDoubleSurcharge] = useState("1.50");
  const [retention, setRetention] = useState("24 Hours");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from("shops").select("*").limit(1).single();
      if (data) {
        setShopData(data);
        setShopId(data.id);
        setBwPrice(((data.bw_price_paise || 200) / 100).toFixed(2));
        setColorPrice(((data.color_price_paise || 1000) / 100).toFixed(2));
        setDoubleSurcharge(((data.double_sided_price_paise || 50) / 100).toFixed(2));
      }
    };
    init();
  }, []);

  const handleSave = async () => {
    if (!shopId) return;
    setSaving(true);
    await supabase.from("shops").update({
      bw_price_paise: Math.round(parseFloat(bwPrice) * 100),
      color_price_paise: Math.round(parseFloat(colorPrice) * 100),
      double_sided_price_paise: Math.round(parseFloat(doubleSurcharge) * 100),
    }).eq("id", shopId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex" style={{ fontFamily: "'Geist', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      {/* NavigationDrawer */}
      <aside className="fixed left-0 top-0 h-full w-80 bg-surface-container/90 glass-effect shadow-md flex flex-col py-6 z-40 rounded-r-xl transition-all duration-300">
        <div className="px-6 mb-10 flex flex-col items-start">
          <h1 className="text-headline-lg font-black text-primary mb-1">Smart Print</h1>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-title-md">CH</div>
            <div>
              <p className="text-title-md text-on-surface">Campus Center Hub</p>
              <p className="text-label-md text-on-surface-variant">Operator Dashboard</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <Link href="/owner/dashboard" className="flex items-center gap-4 text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 transition-colors">
            <span className="material-symbols-outlined">queue_play_next</span>
            <span className="text-label-md">Active Queue</span>
          </Link>
          <Link href="/owner/history" className="flex items-center gap-4 text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 transition-colors">
            <span className="material-symbols-outlined">history</span>
            <span className="text-label-md">Print History</span>
          </Link>
          <Link href="/owner/health" className="flex items-center gap-4 text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 transition-colors">
            <span className="material-symbols-outlined">monitor_heart</span>
            <span className="text-label-md">System Health</span>
          </Link>
          <Link href="/owner/settings" className="flex items-center gap-4 bg-primary-container text-on-primary-container rounded-full mx-2 px-4 py-3 translate-x-1 duration-200 shadow-sm">
            <span className="material-symbols-outlined active-nav-link">settings</span>
            <span className="text-label-md font-bold">Settings</span>
          </Link>
          <Link href="#" className="flex items-center gap-4 text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 transition-colors">
            <span className="material-symbols-outlined">help</span>
            <span className="text-label-md">Support</span>
          </Link>
        </nav>
        <div className="mt-auto px-6 border-t border-outline-variant pt-6">
          <button onClick={async () => { await logout(); router.push("/login"); }}
            className="flex items-center gap-4 text-error font-bold text-label-md w-full p-3 hover:bg-error-container/20 rounded-lg transition-colors">
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-80 flex-1 flex flex-col min-h-screen">
        {/* TopAppBar */}
        <header className="h-16 w-full flex justify-between items-center px-margin-desktop bg-surface shadow-sm z-30 sticky top-0">
          <span className="text-title-md font-bold text-primary">Shop Configuration</span>
          <div className="flex items-center gap-6">
            <span className="text-label-md text-primary font-bold">ADMIN</span>
          </div>
        </header>

        {/* Page Content */}
        <section className="flex-1 p-margin-desktop space-y-gutter max-w-5xl mx-auto w-full" style={{ padding: '40px' }}>
          <div className="flex flex-col gap-2 mb-4">
            <h2 className="text-headline-lg text-on-surface">Settings</h2>
            <p className="text-body-lg text-on-surface-variant">Configure pricing, retention policies, and printer hardware defaults.</p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {/* Pricing Configuration Card */}
            <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b border-outline-variant pb-4">
                <span className="material-symbols-outlined text-primary">payments</span>
                <h3 className="text-title-md">Pricing & Fees</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-label-md text-on-surface-variant block">B&W Price Per Page</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">₹</span>
                    <input
                      className="w-full h-14 pl-8 pr-4 bg-surface rounded-lg border border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md transition-all outline-none"
                      type="number"
                      step="0.5"
                      value={bwPrice}
                      onChange={e => setBwPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-label-md text-on-surface-variant block">Color Price Per Page</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">₹</span>
                    <input
                      className="w-full h-14 pl-8 pr-4 bg-surface rounded-lg border border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md transition-all outline-none"
                      type="number"
                      step="0.5"
                      value={colorPrice}
                      onChange={e => setColorPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-label-md text-on-surface-variant block">Double Side Surcharge (Flat Rate)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">₹</span>
                    <input
                      className="w-full h-14 pl-8 pr-4 bg-surface rounded-lg border border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md transition-all outline-none"
                      type="number"
                      step="0.5"
                      value={doubleSurcharge}
                      onChange={e => setDoubleSurcharge(e.target.value)}
                    />
                  </div>
                  <p className="text-label-sm text-outline">Applied once per document if double-sided printing is selected.</p>
                </div>
              </div>
            </div>

            {/* File Retention Card */}
            <div className="md:col-span-4 bg-surface-container-high p-8 rounded-xl shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-on-surface/10 pb-4">
                  <span className="material-symbols-outlined text-primary">timer</span>
                  <h3 className="text-title-md">System Policy</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-label-md text-on-surface-variant block">File Retention Period</label>
                    <select
                      className="w-full h-14 px-4 bg-surface-container-lowest rounded-lg border border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md transition-all outline-none appearance-none"
                      value={retention}
                      onChange={e => setRetention(e.target.value)}
                    >
                      <option>12 Hours</option>
                      <option>24 Hours</option>
                      <option>48 Hours</option>
                      <option>7 Days</option>
                    </select>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <p className="text-label-sm text-primary leading-relaxed">Files are automatically purged from the local cache after the retention period to maintain security and disk space.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Printer Selection */}
            <div className="md:col-span-12 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/30 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-outline-variant pb-4">
                  <span className="material-symbols-outlined text-primary">print</span>
                  <h3 className="text-title-md">Hardware Management</h3>
                </div>
                <div className="space-y-2">
                  <label className="text-label-md text-on-surface-variant block">Active Printer Selection</label>
                  <div className="flex gap-4">
                    <select className="flex-1 h-14 px-4 bg-surface rounded-lg border border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md outline-none">
                      <option>HP LaserJet Enterprise M608 (IP: 192.168.1.45)</option>
                      <option>Xerox VersaLink C400 (IP: 192.168.1.48)</option>
                      <option disabled>Canon imageRUNNER (Offline)</option>
                    </select>
                    <button className="h-14 px-6 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary/5 transition-all flex items-center gap-2 active:scale-95">
                      <span className="material-symbols-outlined">description</span>
                      Test Print
                    </button>
                  </div>
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden h-48 border border-outline-variant">
                <div className="absolute inset-0 bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-5xl text-tertiary-fixed-dim">print</span>
                    <p className="text-label-md font-bold text-on-surface mt-2">System Online & Ready</p>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-tertiary-fixed-dim animate-pulse"></div>
                  <span className="text-label-md font-bold text-on-surface">System Online & Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end items-center gap-4 pt-6 border-t border-outline-variant">
            <button
              onClick={() => router.push('/owner/dashboard')}
              className="px-8 h-14 text-on-surface-variant font-bold hover:bg-surface-variant rounded-full transition-all"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-10 h-14 font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-2 ${saved ? 'bg-tertiary text-on-tertiary' : 'bg-primary text-on-primary'}`}
            >
              <span className="material-symbols-outlined">{saving ? 'sync' : saved ? 'check_circle' : 'save'}</span>
              {saving ? 'Updating...' : saved ? 'Changes Saved' : 'Save Changes'}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-unit px-margin-desktop bg-surface border-t border-outline-variant flex flex-row justify-between items-center gap-4 mt-auto">
          <span className="text-label-md font-bold text-on-surface">© 2024 Smart Print Campus Utilities</span>
          <div className="flex gap-6">
            <a className="text-label-sm text-on-surface-variant hover:underline decoration-2 underline-offset-4" href="#">Support</a>
            <a className="text-label-sm text-on-surface-variant hover:underline decoration-2 underline-offset-4" href="#">Print History</a>
            <a className="text-label-sm text-on-surface-variant hover:underline decoration-2 underline-offset-4" href="#">Terms of Service</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
