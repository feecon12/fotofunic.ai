import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const plans = {
  "pro-monthly": {
    id: "pro-monthly",
    name: "Pro Plan",
    amount: 79900, // amount in smallest currency unit (paise)
    currency: "INR",
    interval: "month",
  },
} as const;

type PlanId = keyof typeof plans;

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
    const planId: PlanId | undefined = body?.planId;
    if (!planId || !plans[planId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
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

    const plan = plans[planId];
    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
    ).toString("base64");

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        amount: plan.amount,
        currency: plan.currency,
        receipt: `rcpt_${plan.id}_${Date.now()}`,
        notes: {
          planId: plan.id,
          userId: user.id,
          email: user.email || "",
        },
      }),
    });

    if (!orderRes.ok) {
      const message = await orderRes.text();
      return NextResponse.json(
        { error: "Failed to create Razorpay order", detail: message },
        { status: 502 },
      );
    }

    const order = await orderRes.json();

    return NextResponse.json({
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
      customer: {
        email: user.email,
        name: user.user_metadata?.name,
      },
    });
  } catch (error) {
    console.error("create-order error", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
