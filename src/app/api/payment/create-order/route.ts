import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';

// Initialize razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mock',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
});

export async function POST(req: Request) {
  try {
    const { jobId, amountPaise } = await req.json();
    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: jobId,
    };
    
    // Check if mock keys
    if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === 'rzp_test_mock' || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
       return NextResponse.json({
         id: "order_mock_" + Date.now(),
         amount: amountPaise,
         currency: "INR",
         receipt: jobId
       });
    }

    const order = await razorpay.orders.create(options);
    return NextResponse.json(order);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
