import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      jobId,
    } = await request.json();

    // If mock order (dev mode), just confirm success
    if (!razorpay_order_id || razorpay_order_id.startsWith('mock_')) {
      return NextResponse.json({ success: true, mock: true });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: true, mock: true });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Verify payment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
