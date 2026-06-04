import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // fallback for testing
);

export async function POST(req: Request) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, jobId } = await req.json();
    
    // Verify signature if using real keys
    if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID !== 'rzp_test_mock' && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
       const body = razorpay_order_id + "|" + razorpay_payment_id;
       const expectedSignature = crypto
         .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
         .update(body.toString())
         .digest("hex");
         
       if (expectedSignature !== razorpay_signature) {
         return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
       }
    }

    // Update job status to queued
    const { error } = await supabaseAdmin
      .from('print_jobs')
      .update({ status: 'queued', razorpay_payment_id, razorpay_order_id })
      .eq('id', jobId);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
