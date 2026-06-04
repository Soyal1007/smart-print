require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const ptp = require('pdf-to-printer');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function authenticateAgent() {
  // In production, the agent logs in with owner credentials.
  // Using an anonymous session for MVP demo.
  console.log("Agent authenticated.");
}

async function addUidFooterToPdf(buffer, uid) {
  const pdfDoc = await PDFDocument.load(buffer);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  
  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawText(`UID: ${uid}`, {
      x: 20,
      y: 20,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
  }
  
  return await pdfDoc.save();
}

async function processJob(job) {
  console.log(`Processing job ${job.id}`);
  
  try {
    // 1. Mark as printing
    await supabase.from('print_jobs').update({ status: 'printing' }).eq('id', job.id);
    
    // Fetch user UID
    const { data: profile } = await supabase.from('profiles').select('uid').eq('id', job.user_id).single();
    const uid = profile ? profile.uid : 'UNKNOWN';

    // Fetch files
    const { data: files } = await supabase.from('job_files').select('*').eq('job_id', job.id);
    
    for (const file of files) {
      console.log(`Downloading ${file.original_filename}...`);
      const { data: fileData, error } = await supabase.storage.from('orders').download(file.storage_path);
      if (error) throw error;
      
      const buffer = await fileData.arrayBuffer();
      
      console.log(`Adding UID footer...`);
      const modifiedPdfBuffer = await addUidFooterToPdf(buffer, uid);
      
      const tempPath = path.join(__dirname, `temp_${Date.now()}.pdf`);
      fs.writeFileSync(tempPath, modifiedPdfBuffer);
      
      console.log(`Sending to printer...`);
      // Note: configuring ptp options based on file settings (color, copies, duplex)
      const printOptions = {
        printer: process.env.PRINTER_NAME || undefined,
        copies: file.copies,
        // Depending on printer drivers and OS, duplex/color options might need specific flags.
        // For standard ptp usage on windows, it uses SumatraPDF under the hood.
      };
      
      try {
        await ptp.print(tempPath, printOptions);
        console.log(`Successfully sent to printer spooler.`);
      } catch (printErr) {
        console.error("Print Error:", printErr);
        throw printErr; // Fail job if it can't print
      }
      
      fs.unlinkSync(tempPath); // cleanup
    }
    
    // Mark as printed
    await supabase.from('print_jobs').update({ status: 'printed' }).eq('id', job.id);
    console.log(`Job ${job.id} marked as printed.`);
    
  } catch (error) {
    console.error(`Failed to process job ${job.id}:`, error);
    await supabase.from('print_jobs').update({ status: 'failed' }).eq('id', job.id);
  }
}

async function startAgent() {
  await authenticateAgent();
  
  console.log("Listening for new queued jobs...");
  
  // Listen for realtime updates
  const channel = supabase.channel('print_agent')
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'print_jobs',
      filter: 'status=eq.queued'
    }, payload => {
      console.log("New queued job detected:", payload.new.id);
      processJob(payload.new);
    })
    .subscribe();
    
  // Check for any missed queued jobs on startup
  const { data: missedJobs } = await supabase
    .from('print_jobs')
    .select('*')
    .eq('status', 'queued');
    
  if (missedJobs && missedJobs.length > 0) {
    console.log(`Found ${missedJobs.length} missed jobs on startup.`);
    for (const job of missedJobs) {
      await processJob(job);
    }
  }
}

startAgent().catch(console.error);
