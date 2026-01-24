"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase";
import { CheckCircle2, CreditCard } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Invoice = {
  date: string;
  amount: number;
  currency: string;
  status: string;
  orderId?: string;
  paymentId?: string;
  planId?: string;
};

const PLAN = {
  id: "pro-monthly",
  name: "Pro Plan",
  price: 799,
  amount: 79900, // paise for INR
  currency: "INR",
  interval: "Monthly",
  description: "1000 images, all models, priority support",
};

export default function BillingPage() {
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);

  const [scriptReady, setScriptReady] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [customer, setCustomer] = useState<{
    name?: string | null;
    email?: string | null;
  }>({});
  const [billingHistory, setBillingHistory] = useState<Invoice[]>([
    {
      date: "2026-01-24T00:00:00.000Z",
      amount: 29900,
      currency: "INR",
      status: "Paid",
      orderId: "demo-order",
      planId: PLAN.id,
    },
  ]);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCustomer({ name: user.user_metadata?.name, email: user.email });
      }
    };
    loadUser();
  }, [supabase]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () =>
      toast({
        title: "Razorpay failed to load",
        description: "Check your network and try again.",
        variant: "destructive",
      });
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [toast]);

  const formatMoney = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(amount / 100);
    } catch {
      return `${currency} ${amount / 100}`;
    }
  };

  const handleCheckout = async () => {
    if (!scriptReady) {
      toast({
        title: "Payment unavailable",
        description: "Razorpay is still loading. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    setIsPaying(true);
    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: PLAN.id }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || "Could not start checkout");
      }

      const { order, keyId, customer: customerData } = await res.json();

      const rzp = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Fotofunic AI",
        description: `${PLAN.name} (${PLAN.interval})`,
        order_id: order.id,
        prefill: {
          name: customerData?.name || customer?.name || "",
          email: customerData?.email || customer?.email || "",
        },
        notes: {
          planId: PLAN.id,
        },
        handler: async (response: any) => {
          try {
            const verify = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                planId: PLAN.id,
                amount: order.amount,
                currency: order.currency,
              }),
            });

            if (!verify.ok) {
              throw new Error("Payment verification failed");
            }

            const payload = await verify.json();
            const invoice = payload?.invoice as Invoice | undefined;
            if (invoice) {
              setBillingHistory((prev) => [invoice, ...prev]);
            }

            toast({
              title: "Payment successful",
              description: "Your subscription is now active.",
            });
          } catch (err) {
            console.error(err);
            toast({
              title: "Verification failed",
              description:
                "We could not confirm the payment. Please contact support.",
              variant: "destructive",
            });
          }
        },
      });

      rzp.on("payment.failed", (resp: any) => {
        toast({
          title: "Payment failed",
          description:
            resp?.error?.description || "The payment was not completed.",
          variant: "destructive",
        });
      });

      rzp.open();
    } catch (error) {
      console.error(error);
      toast({
        title: "Checkout error",
        description:
          error instanceof Error ? error.message : "Unable to start payment",
        variant: "destructive",
      });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Upgrade, manage payments, and view invoices
        </p>
      </div>

      <Card className="border-2 border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{PLAN.name}</CardTitle>
              <CardDescription>{PLAN.description}</CardDescription>
            </div>
            <Badge className="h-fit">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Billing Cycle</p>
              <p className="font-medium">{PLAN.interval}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium text-lg">
                {formatMoney(PLAN.amount, PLAN.currency)} / {PLAN.interval}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">Renewing automatically</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Provider</p>
              <p className="font-medium">Razorpay</p>
            </div>
          </div>
          <Button onClick={handleCheckout} disabled={isPaying}>
            {isPaying ? "Processing..." : "Pay with Razorpay"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <CardDescription>Everything in your Pro plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>1000 images per month</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>All AI models available</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Priority support</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Custom model training</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>API access</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Secure checkout via Razorpay</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="font-medium">Card / UPI / NetBanking</p>
                <p className="text-sm text-muted-foreground">
                  Handled by Razorpay
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckout}
              disabled={isPaying}
            >
              {isPaying ? "Processing" : "Pay now"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Payments are processed securely by Razorpay. Your card details never
            touch our servers.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Recent invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {billingHistory.map((invoice, i) => (
            <div
              key={`${invoice.orderId || "invoice"}-${i}`}
              className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-medium">
                  {new Date(invoice.date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {invoice.orderId ? `Order ${invoice.orderId}` : "Invoice"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {formatMoney(invoice.amount, invoice.currency)}
                </span>
                <Separator
                  orientation="vertical"
                  className="hidden h-6 md:block"
                />
                <Badge variant="outline">{invoice.status}</Badge>
              </div>
            </div>
          ))}
          {billingHistory.length === 0 && (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
