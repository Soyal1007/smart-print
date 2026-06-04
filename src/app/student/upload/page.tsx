"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { getSession, logout } from "@/app/actions/auth";

interface UploadFile {
  file: File;
  pageCount: number;
  fileSize: string;
  settings: {
    color_mode: "bw" | "color";
    sides: "single" | "double";
    copies: number;
    page_range: string;
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StudentUpload() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [shopPrices, setShopPrices] = useState<any>(null);
  const [shopId, setShopId] = useState<string>("");
  const [uid, setUid] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const user = await getSession();
      if (!user) { router.push("/login"); return; }
      setUid(user.uid);
      if (user.name) setName(user.name);
      const { data } = await supabase.from("shops").select("*").limit(1).single();
      if (data) {
        setShopPrices({
          bw: data.bw_price_paise || 200,
          color: data.color_price_paise || 1000,
          single: data.single_sided_price_paise || 0,
          double: data.double_sided_price_paise || 50,
        });
        setShopId(data.id);
      }
    };
    init();
  }, []);

  const processFiles = async (rawFiles: File[]) => {
    const processed: UploadFile[] = [];
    for (const file of rawFiles) {
      let pageCount = 1;
      if (file.type === "application/pdf") {
        try {
          const buf = await file.arrayBuffer();
          const pdf = await PDFDocument.load(buf);
          pageCount = pdf.getPageCount();
        } catch (e) { /* fallback */ }
      }
      processed.push({
        file, pageCount, fileSize: formatFileSize(file.size),
        settings: { color_mode: "bw", sides: "single", copies: 1, page_range: "all" }
      });
    }
    setFiles(prev => [...prev, ...processed]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await processFiles(Array.from(e.target.files));
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) await processFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  const calculateTotal = () => {
    if (!shopPrices) return 0;
    return files.reduce((total, f) => {
      const base = f.settings.color_mode === 'color' ? shopPrices.color : shopPrices.bw;
      const sides = f.settings.sides === 'double' ? shopPrices.double : shopPrices.single;
      return total + ((base + sides) * f.pageCount * f.settings.copies);
    }, 0);
  };

  const totalPages = files.reduce((acc, f) => acc + (f.pageCount * f.settings.copies), 0);

  const handleUpload = async () => {
    if (files.length === 0 || !shopId) return;
    setUploading(true);
    try {
      const user = await getSession();
      if (!user) throw new Error("Not logged in");
      const totalPrice = calculateTotal();

      const { data: job, error: jobError } = await supabase
        .from("print_jobs")
        .insert({ user_id: user.id, shop_id: shopId, status: "uploaded", total_pages: totalPages, total_price_paise: totalPrice })
        .select().single();
      if (jobError) throw jobError;

      for (const f of files) {
        let finalFile: File | Blob = f.file;
        if (f.file.type === "application/pdf") {
          try {
            const buf = await f.file.arrayBuffer();
            const pdf = await PDFDocument.load(buf);
            const font = await pdf.embedFont(StandardFonts.HelveticaBold);
            for (const page of pdf.getPages()) {
              const { width, height } = page.getSize();
              const text = `UID: ${user.uid}`;
              const tw = font.widthOfTextAtSize(text, 12);
              page.drawRectangle({ x: width - tw - 25, y: height - 30, width: tw + 10, height: 20, color: rgb(1, 1, 1), opacity: 0.8 });
              page.drawText(text, { x: width - tw - 20, y: height - 25, size: 12, font, color: rgb(0, 0, 0) });
            }
            finalFile = new Blob([await pdf.save()], { type: "application/pdf" });
          } catch (e) { /* fallback */ }
        }
        const safeFilename = `${Date.now()}_${f.file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const storagePath = `${job.id}/${safeFilename}`;
        const { error: uploadError } = await supabase.storage.from("orders").upload(storagePath, finalFile);
        if (uploadError) throw uploadError;
        await supabase.from("job_files").insert({
          job_id: job.id, original_filename: f.file.name, storage_path: storagePath,
          page_count: f.pageCount, color_mode: f.settings.color_mode, sides: f.settings.sides,
          copies: f.settings.copies, page_range: f.settings.page_range,
        });
      }
      router.push(`/student/preview/${job.id}`);
    } catch (error: any) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => { await logout(); router.push("/login"); };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col" style={{ fontFamily: "'Geist', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      {/* TopAppBar */}
      <header className="bg-surface shadow-sm sticky top-0 z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop w-full h-16">
        <div className="flex items-center gap-3">
          <img alt="College Logo" className="w-10 h-10 rounded-lg object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyiu6s2JTPGnswZA1eR1JGMfYFFRlEI0zkrWreT3W4Q0WcScegQcPecqZeJNnTuWtuMb4N8IlmLMeU2wvhcDoTiG3r3-wJpdTVvKLSCUs4s6IrKEf3XFTWAH_g4JgH6Tk6YSTRWifxyHVo9-gF2OE_ObQID0cWOzKiaLYl8A1o4-d8G00AW8h0wDUbwpF5ucQXkMpEakHjVyMapGYMx_UCaT-e-ClojZddPe0VcYcnYUvHawp0A5aB7bUHPikPAHkd2DkPd_kbsTI" />
          <span className="text-title-md font-bold text-primary">Smart Print</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-label-md text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full">
            {name ? `${name} (${uid})` : `UID: ${uid}`}
          </span>
          <button onClick={handleLogout} className="material-symbols-outlined text-primary-container cursor-pointer text-2xl">account_circle</button>
        </div>
      </header>

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 pb-32">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-headline-lg-mobile md:text-headline-lg text-primary mb-2">Upload Documents</h1>
          <p className="text-body-md text-on-surface-variant">Select the files you'd like to print. Supporting PDF, Office documents, and images.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left: Dropzone */}
          <div className="lg:col-span-7">
            <div
              className={`relative group cursor-pointer border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-lowest transition-all duration-300 h-96 flex flex-col items-center justify-center p-8 hover:bg-surface-container-low hover:border-primary ${dragOver ? 'border-primary bg-surface-container scale-[1.01]' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input ref={fileInputRef} accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png" className="hidden" multiple type="file" onChange={handleFileChange} />
              <div className="w-20 h-20 rounded-full bg-primary-container/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-5xl">cloud_upload</span>
              </div>
              <div className="text-center">
                <h3 className="text-title-md text-on-surface mb-2">Drag and drop files here</h3>
                <p className="text-body-md text-on-surface-variant mb-6">or <span className="text-primary font-bold">browse your computer</span></p>
              </div>
              <div className="flex gap-4 items-center">
                {['picture_as_pdf|PDF', 'description|DOCX', 'slideshow|PPT', 'image|IMG'].map(item => {
                  const [icon, label] = item.split('|');
                  return (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-on-surface-variant/60">{icon}</span>
                      <span className="text-label-sm uppercase tracking-wider text-on-surface-variant/60">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Queue */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-title-md text-on-surface">Queue ({files.length})</h2>
              <span className="text-label-md text-primary font-bold">Total: {totalPages} pages</span>
            </div>

            <div className="flex flex-col gap-3">
              {files.map((f, index) => (
                <div key={index} className="border border-outline-variant/30 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow glass-panel">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary">description</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-label-md text-on-surface truncate font-medium">{f.file.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-surface-container-high text-on-surface-variant text-label-sm px-2 py-0.5 rounded font-bold uppercase">{f.pageCount} Pages</span>
                        <span className="text-label-sm text-on-surface-variant/60">{f.fileSize}</span>
                      </div>
                    </div>
                    <button className="p-2 rounded-full hover:bg-error-container hover:text-on-error-container text-on-surface-variant/40 transition-colors" onClick={() => removeFile(index)}>
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>

                  {/* Settings */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/30">
                    <select
                      value={f.settings.color_mode}
                      onChange={(e) => setFiles(prev => { const n = [...prev]; n[index] = { ...n[index], settings: { ...n[index].settings, color_mode: e.target.value as 'bw' | 'color' } }; return n; })}
                      className="text-xs bg-surface-container-low border border-outline-variant/50 rounded-lg px-2 py-1.5 focus:border-primary focus:outline-none text-on-surface"
                    >
                      <option value="bw">B&W</option>
                      <option value="color">Color</option>
                    </select>
                    <select
                      value={f.settings.sides}
                      onChange={(e) => setFiles(prev => { const n = [...prev]; n[index] = { ...n[index], settings: { ...n[index].settings, sides: e.target.value as 'single' | 'double' } }; return n; })}
                      className="text-xs bg-surface-container-low border border-outline-variant/50 rounded-lg px-2 py-1.5 focus:border-primary focus:outline-none text-on-surface"
                    >
                      <option value="single">Single Side</option>
                      <option value="double">Double Side</option>
                    </select>
                    <input type="number" min="1" max="100" placeholder="Copies" value={f.settings.copies}
                      onChange={(e) => setFiles(prev => { const n = [...prev]; n[index] = { ...n[index], settings: { ...n[index].settings, copies: parseInt(e.target.value) || 1 } }; return n; })}
                      className="text-xs bg-surface-container-low border border-outline-variant/50 rounded-lg px-2 py-1.5 focus:border-primary focus:outline-none text-on-surface" />
                    <input type="text" placeholder="Pages (e.g. 1-5)"
                      value={f.settings.page_range === 'all' ? '' : f.settings.page_range}
                      onChange={(e) => setFiles(prev => { const n = [...prev]; n[index] = { ...n[index], settings: { ...n[index].settings, page_range: e.target.value || 'all' } }; return n; })}
                      className="text-xs bg-surface-container-low border border-outline-variant/50 rounded-lg px-2 py-1.5 focus:border-primary focus:outline-none text-on-surface" />
                  </div>
                </div>
              ))}
              {files.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant/40">
                  <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                  <p className="text-label-md">No files in queue</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest px-margin-mobile py-4 border-t border-outline-variant shadow-[0px_-4px_20px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="hidden md:flex flex-col">
            <p className="text-label-sm text-on-surface-variant">© 2024 Smart Print Campus Utilities</p>
            <div className="flex gap-4 mt-1">
              <a className="text-label-sm text-on-surface-variant hover:underline decoration-2 underline-offset-4" href="#">Support</a>
              <a className="text-label-sm text-on-surface-variant hover:underline decoration-2 underline-offset-4" href="#">Terms of Service</a>
            </div>
          </div>
          <div className="flex w-full md:w-auto items-center gap-6 justify-between md:justify-end">
            <div className="flex flex-col text-right">
              <span className="text-label-sm text-on-surface-variant">Estimated Cost</span>
              <span className="text-title-md font-bold text-primary">₹{(calculateTotal() / 100).toFixed(2)}</span>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="flex items-center justify-center gap-2 bg-primary text-on-primary font-bold px-8 py-4 rounded-full h-14 hover:shadow-lg transition-all active:scale-95 duration-150 group disabled:opacity-60 disabled:pointer-events-none"
            >
              {uploading ? (
                <><span className="material-symbols-outlined animate-spin text-xl">sync</span><span className="text-label-md">Uploading...</span></>
              ) : (
                <><span className="text-label-md">Continue to Preview</span><span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
