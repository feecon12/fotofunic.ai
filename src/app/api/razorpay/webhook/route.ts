import crypto from "crypto";
import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    const payload = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (expected !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(payload);
    const payloadStatus =
      event?.payload?.payment?.entity?.status ||
      event?.payload?.order?.entity?.status;
    const paymentId = event?.payload?.payment?.entity?.id;
    const orderId =
      event?.payload?.payment?.entity?.order_id ||
      event?.payload?.order?.entity?.id;
    const amount = event?.payload?.payment?.entity?.amount;
    const currency = event?.payload?.payment?.entity?.currency;
    const notes =
      event?.payload?.payment?.entity?.notes ||
      event?.payload?.order?.entity?.notes;

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin.from("billing_payments").upsert(
          {
            order_id: orderId,
            payment_id: paymentId,
            status: payloadStatus,
            amount,
            currency,
            plan_id: notes?.planId,
            user_id: notes?.userId,
            email: notes?.email,
            meta: event,
          },
          { onConflict: "order_id" },
        );
        if (error) {
          console.error("Supabase webhook upsert error", error);
        }
      } catch (err) {
        console.error("Supabase admin unavailable", err);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("webhook error", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
