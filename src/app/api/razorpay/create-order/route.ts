import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { amount, jobId } = await request.json();

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      // Dev mode: return a fake order
      console.warn("Razorpay keys not set, returning mock order");
      return NextResponse.json({
        id: `mock_order_${Date.now()}`,
        amount,
        currency: "INR",
        mock: true,
      });
    }

    const credentials = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `smart_print_${jobId?.slice(0, 8) || Date.now()}`,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Razorpay order creation failed:", err);
      // Return a mock order as fallback
      return NextResponse.json({
        id: `mock_order_${Date.now()}`,
        amount,
        currency: "INR",
        mock: true,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
