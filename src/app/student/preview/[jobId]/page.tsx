"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { use } from "react";
import { getSession } from "@/app/actions/auth";

interface FilePreview {
  id: string;
  filename: string;
  storage_path: string;
  page_count: number;
  color_mode: string;
  sides: string;
  copies: number;
  page_range: string;
  signedUrl: string | null;
  urlError: boolean;
}

export default function DocumentPreviewPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [job, setJob] = useState<any>(null);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const user = await getSession();
      if (!user) { router.push("/login"); return; }
      setUid(user.uid);

      const { data, error } = await supabase
        .from("print_jobs")
        .select("*, job_files(*)")
        .eq("id", jobId)
        .single();

      if (error || !data) { setLoading(false); return; }
      setJob(data);

      // Build signed URLs for ALL files in parallel
      const fileList: FilePreview[] = await Promise.all(
        (data.job_files || []).map(async (f: any) => {
          const { data: signed } = await supabase.storage
            .from("orders")
            .createSignedUrl(f.storage_path, 3600);
          return {
            id: f.id,
            filename: f.original_filename,
            storage_path: f.storage_path,
            page_count: f.page_count || 1,
            color_mode: f.color_mode,
            sides: f.sides,
            copies: f.copies || 1,
            page_range: f.page_range || "all",
            signedUrl: signed?.signedUrl ?? null,
            urlError: !signed?.signedUrl,
          };
        })
      );
      setFiles(fileList);
      setLoading(false);
    };
    init();
  }, [jobId]);

  // ── Derived from active file ────────────────────────────────────────────────
  const activeFile = files[activeFileIdx];
  const isPdf = activeFile
    ? /\.pdf$/i.test(activeFile.storage_path) || /\.pdf$/i.test(activeFile.filename)
    : false;
  const isImage = activeFile
    ? /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(activeFile.storage_path || activeFile.filename)
    : false;

  // ── Totals across all files ─────────────────────────────────────────────────
  const totalPages  = files.reduce((acc, f) => acc + f.page_count * f.copies, 0);
  const totalAmount = job?.total_price_paise ? (job.total_price_paise / 100).toFixed(2) : "0.00";

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: 48 }}>sync</span>
      <p className="text-body-md text-on-surface-variant">Loading preview…</p>
    </div>
  );

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col"
      style={{ fontFamily: "'Geist', sans-serif", WebkitFontSmoothing: "antialiased" }}>

      {/* ── TopAppBar ── */}
      <header className="bg-surface shadow-sm fixed top-0 w-full h-16 z-[60] flex justify-between items-center px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined">school</span>
          </div>
          <span className="text-title-md font-bold text-primary">Smart Print</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden md:block text-label-md text-on-surface-variant">UID: {uid}</span>
          <button className="p-2 rounded-full hover:bg-surface-variant transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-32 md:pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

          {/* ── LEFT: Preview pane ── */}
          <div className="lg:col-span-7 flex flex-col gap-4">

            {/* Header row */}
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-headline-lg-mobile md:text-headline-lg text-primary">Preview Document</h1>
                <p className="text-body-md text-on-surface-variant">
                  {files.length} file{files.length !== 1 ? "s" : ""} · UID will be printed in top-right corner
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(z => Math.min(z + 25, 200))}
                  className="p-2 bg-surface-container-high rounded-lg hover:bg-surface-variant transition-all"
                  title="Zoom in"
                >
                  <span className="material-symbols-outlined">zoom_in</span>
                </button>
                <span className="text-label-sm text-on-surface-variant w-12 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom(z => Math.max(z - 25, 50))}
                  className="p-2 bg-surface-container-high rounded-lg hover:bg-surface-variant transition-all"
                  title="Zoom out"
                >
                  <span className="material-symbols-outlined">zoom_out</span>
                </button>
              </div>
            </div>

            {/* ── File switcher tabs (only shown when > 1 file) ── */}
            {files.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {files.map((f, i) => (
                  <button
                    key={f.id}
                    onClick={() => { setActiveFileIdx(i); setZoom(100); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-label-md whitespace-nowrap transition-all flex-shrink-0 border
                      ${activeFileIdx === i
                        ? "bg-primary text-on-primary border-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container"
                      }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {/\.pdf$/i.test(f.filename) ? "picture_as_pdf"
                        : /\.(jpg|jpeg|png|gif|webp)$/i.test(f.filename) ? "image"
                        : "description"}
                    </span>
                    <span className="truncate max-w-[140px]">{f.filename}</span>
                    <span className="bg-white/20 rounded-full px-1.5 text-[10px] font-bold">{f.page_count}p</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Preview window ── */}
            <div
              className="relative w-full bg-white rounded-xl shadow-md border border-outline-variant overflow-hidden group"
              style={{ height: "600px" }}
            >
              {/* UID Watermark Stamp — always visible, matches actual printout */}
              {uid && (
                <div
                  className="absolute top-3 right-3 z-20 bg-white/90 border border-outline-variant/60 rounded px-2 py-0.5 shadow-sm pointer-events-none"
                  style={{ backdropFilter: "blur(4px)" }}
                >
                  <span className="text-[11px] font-bold text-on-surface tracking-wide">UID: {uid}</span>
                </div>
              )}

              {/* PDF — native browser embed */}
              {activeFile && isPdf && activeFile.signedUrl && !activeFile.urlError && (
                <iframe
                  key={activeFile.id}
                  src={activeFile.signedUrl}
                  className="w-full h-full border-0"
                  title={activeFile.filename}
                  onError={() =>
                    setFiles(prev =>
                      prev.map((f, i) => i === activeFileIdx ? { ...f, urlError: true } : f)
                    )
                  }
                  style={{
                    transformOrigin: "top left",
                    transform: zoom !== 100
                      ? `scale(${zoom / 100})`
                      : undefined,
                    width: zoom !== 100 ? `${10000 / zoom}%` : "100%",
                    height: zoom !== 100 ? `${10000 / zoom}%` : "100%",
                  }}
                />
              )}

              {/* Image */}
              {activeFile && isImage && activeFile.signedUrl && (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                  <img
                    src={activeFile.signedUrl}
                    alt={activeFile.filename}
                    className="object-contain transition-opacity opacity-90 group-hover:opacity-100"
                    style={{
                      maxHeight: "100%",
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "center",
                    }}
                  />
                </div>
              )}

              {/* Fallback / error */}
              {activeFile && (!activeFile.signedUrl || activeFile.urlError || (!isPdf && !isImage)) && (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-8 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary-container/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 44 }}>description</span>
                  </div>
                  <div>
                    <p className="text-title-md text-on-surface font-bold mb-1 truncate max-w-xs">{activeFile.filename}</p>
                    <p className="text-body-md text-on-surface-variant mb-1">{activeFile.page_count} pages</p>
                    <p className="text-label-sm text-outline">
                      {activeFile.urlError
                        ? "Preview unavailable. File uploaded successfully."
                        : "Preview not supported for this file type. File uploaded correctly."}
                    </p>
                  </div>
                  {activeFile.signedUrl && (
                    <a
                      href={activeFile.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full text-label-md font-bold hover:shadow-md transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined">open_in_new</span>
                      Open in New Tab
                    </a>
                  )}
                </div>
              )}

              {/* Empty state */}
              {!activeFile && (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                  <span className="material-symbols-outlined" style={{ fontSize: 48 }}>folder_open</span>
                </div>
              )}
            </div>

            {/* Open in new tab */}
            {activeFile?.signedUrl && (
              <div className="flex items-center justify-between">
                <p className="text-label-sm text-on-surface-variant">
                  <span className="font-bold text-primary">UID: {uid}</span> will be stamped in the top-right corner of every page
                </p>
                <a
                  href={activeFile.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-label-sm text-primary hover:underline underline-offset-4 decoration-2 flex-shrink-0"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                  Open full file
                </a>
              </div>
            )}
          </div>

          {/* ── RIGHT: Summary & actions ── */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Warning */}
            <div className="bg-error-container border-l-4 border-error p-6 rounded-xl flex gap-4 items-start shadow-sm">
              <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <p className="text-on-error-container text-label-md leading-relaxed">
                Please verify your files carefully before payment. <strong>Printing begins automatically after payment</strong> — no further approval needed.
              </p>
            </div>

            {/* Files list summary */}
            {files.length > 0 && (
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/50">
                  <h2 className="text-title-md text-on-surface">Files ({files.length})</h2>
                </div>
                <div className="divide-y divide-outline-variant/40 max-h-52 overflow-y-auto">
                  {files.map((f, i) => (
                    <button
                      key={f.id}
                      onClick={() => { setActiveFileIdx(i); setZoom(100); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-surface-container-low transition-colors
                        ${activeFileIdx === i ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                    >
                      <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">
                        {/\.pdf$/i.test(f.filename) ? "picture_as_pdf" : /\.(jpg|jpeg|png|gif|webp)$/i.test(f.filename) ? "image" : "description"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-label-md text-on-surface truncate">{f.filename}</p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-label-sm text-on-surface-variant">{f.page_count} pages</span>
                          <span className="text-label-sm text-outline">·</span>
                          <span className="text-label-sm text-on-surface-variant">{f.color_mode === "color" ? "Color" : "B&W"}</span>
                          <span className="text-label-sm text-outline">·</span>
                          <span className="text-label-sm text-on-surface-variant">{f.copies > 1 ? `${f.copies} copies` : "1 copy"}</span>
                        </div>
                      </div>
                      {activeFileIdx === i && (
                        <span className="material-symbols-outlined text-primary text-base">visibility</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Print Summary totals */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant flex flex-col gap-4">
              <div className="border-b border-outline-variant pb-3">
                <h2 className="text-title-md text-on-surface">Print Summary</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">badge</span>
                    <span className="text-body-md text-on-surface-variant">Student UID</span>
                  </div>
                  <span className="text-label-md text-primary font-bold">{uid}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">folder</span>
                    <span className="text-body-md text-on-surface-variant">Total Files</span>
                  </div>
                  <span className="text-label-md text-on-surface">{files.length} {files.length === 1 ? "file" : "files"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline">auto_stories</span>
                    <span className="text-body-md text-on-surface-variant">Total Pages</span>
                  </div>
                  <span className="text-label-md text-on-surface">{totalPages} pages</span>
                </div>
                <div className="pt-3 border-t border-dashed border-outline-variant">
                  <div className="flex justify-between items-center">
                    <span className="text-title-md text-primary">Total Amount</span>
                    <span className="text-headline-lg-mobile text-primary font-bold">₹{totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-auto">
              <button
                className="w-full py-4 rounded-xl border-2 border-outline text-on-surface text-label-md hover:bg-surface-variant transition-all active:scale-95 duration-150"
                onClick={() => router.back()}
              >
                Back to Settings
              </button>
              <button
                className="w-full py-5 rounded-xl bg-primary text-on-primary text-title-md shadow-lg hover:shadow-xl hover:bg-primary-container transition-all flex items-center justify-center gap-3 active:scale-95 duration-150"
                onClick={() => router.push(`/student/checkout/${jobId}`)}
              >
                Proceed to Payment
                <span className="material-symbols-outlined">payments</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* BottomNavBar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-surface-container-lowest shadow-[0px_-4px_20px_rgba(0,0,0,0.05)] rounded-t-xl">
        <button onClick={() => router.push("/student/upload")} className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-1">
          <span className="material-symbols-outlined">cloud_upload</span>
          <span className="text-label-sm">Upload</span>
        </button>
        <div className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-2xl px-6 py-1">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          <span className="text-label-sm">My Prints</span>
        </div>
        <button onClick={() => router.push("/student/dashboard")} className="flex flex-col items-center justify-center text-on-surface-variant px-6 py-1">
          <span className="material-symbols-outlined">person</span>
          <span className="text-label-sm">Profile</span>
        </button>
      </nav>

      {/* Footer (Desktop) */}
      <footer className="hidden md:flex w-full py-unit px-margin-desktop bg-surface border-t border-outline-variant justify-between items-center gap-4">
        <span className="text-label-md font-bold text-on-surface">© 2024 Smart Print Campus Utilities</span>
        <div className="flex gap-6">
          <a className="text-label-sm text-on-surface-variant hover:underline decoration-2 underline-offset-4" href="#">Support</a>
          <a className="text-label-sm text-on-surface-variant hover:underline decoration-2 underline-offset-4" href="#">Print History</a>
          <a className="text-label-sm text-on-surface-variant hover:underline decoration-2 underline-offset-4" href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
