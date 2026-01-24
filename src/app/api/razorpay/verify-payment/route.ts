import { createServerClient } from "@supabase/ssr";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";

async function getSupabaseServerClient() {
  const cookieStore = (await cookies()) as any;
  const getAllCookies =
    typeof cookieStore.getAll === "function"
      ? cookieStore.getAll.bind(cookieStore)
      : () => [];
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: getAllCookies,
        setAll() {},
      },
    },
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      amount,
      currency,
    } = body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification fields" },
        { status: 400 },
      );
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured" },
        { status: 500 },
      );
    }

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin.from("billing_payments").upsert(
          {
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            signature: razorpay_signature,
            plan_id: planId,
            amount,
            currency,
            status: "paid",
            user_id: user.id,
            email: user.email,
            meta: body,
          },
          { onConflict: "order_id" },
        );
        if (error) {
          console.error("Supabase upsert error", error);
        }
      } catch (err) {
        console.error("Supabase admin unavailable", err);
      }
    }

    const invoice = {
      date: new Date().toISOString(),
      amount,
      currency,
      status: "Paid",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      planId,
    };

    return NextResponse.json({ verified: true, invoice });
  } catch (error) {
    console.error("verify-payment error", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 },
    );
  }
}
