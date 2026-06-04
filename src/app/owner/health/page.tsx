"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/actions/auth";

export default function SystemHealth() {
  const router = useRouter();
  return (
    <div className="bg-background text-on-background overflow-hidden h-screen flex" style={{ fontFamily: "'Geist', sans-serif" }}>
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
          <Link href="/owner/dashboard" className="text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 flex items-center gap-4 transition-colors"><span className="material-symbols-outlined">queue_play_next</span><span className="text-label-md">Active Queue</span></Link>
          <Link href="/owner/history" className="text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 flex items-center gap-4 transition-colors"><span className="material-symbols-outlined">history</span><span className="text-label-md">Print History</span></Link>
          <Link href="/owner/health" className="bg-primary-container text-on-primary-container rounded-full mx-2 px-4 py-3 flex items-center gap-4 translate-x-1 shadow-sm"><span className="material-symbols-outlined active-nav-link">monitor_heart</span><span className="text-label-md font-bold">System Health</span></Link>
          <Link href="/owner/settings" className="text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 flex items-center gap-4 transition-colors"><span className="material-symbols-outlined">settings</span><span className="text-label-md">Settings</span></Link>
        </nav>
        <div className="mt-auto px-4">
          <button onClick={async () => { await logout(); router.push("/login"); }} className="flex items-center gap-4 text-error font-bold text-label-md w-full p-3 hover:bg-error-container/20 rounded-lg transition-colors">
            <span className="material-symbols-outlined">logout</span>Logout
          </button>
        </div>
      </aside>
      <main className="ml-80 flex-1 flex flex-col items-center justify-center">
        <div className="text-center space-y-8 max-w-md">
          <div className="w-24 h-24 bg-tertiary-container rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-on-tertiary-container text-4xl">monitor_heart</span>
          </div>
          <div>
            <h1 className="text-headline-lg text-on-surface mb-2">System Health</h1>
            <p className="text-body-md text-on-surface-variant">All systems operational</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Printer', status: 'Online', ok: true, icon: 'print' },
              { label: 'Database', status: 'Connected', ok: true, icon: 'storage' },
              { label: 'Payments', status: 'Active', ok: true, icon: 'payments' },
              { label: 'Storage', status: 'Healthy', ok: true, icon: 'cloud' },
            ].map(s => (
              <div key={s.label} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.ok ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-on-error-container'}`}>
                  <span className="material-symbols-outlined">{s.icon}</span>
                </div>
                <div>
                  <p className="text-label-md font-bold text-on-surface">{s.label}</p>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${s.ok ? 'bg-tertiary-fixed-dim animate-pulse' : 'bg-error'}`}></span>
                    <p className={`text-label-sm ${s.ok ? 'text-tertiary' : 'text-error'}`}>{s.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
