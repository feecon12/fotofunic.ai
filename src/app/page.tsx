"use client";

import { PublicImageGenerator } from "@/components/public-image-generator";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);

      // If user is logged in, redirect to dashboard
      if (user) {
        router.push("/dashboard");
      }
    };
    checkAuth();
  }, [supabase, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Fotofunic AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/auth/login")}
            >
              Sign In
            </Button>
            <Button onClick={() => router.push("/auth/signup")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Generate Amazing Images with AI
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            Try Fotofunic for free with 2 image generation credits. Sign in to
            unlock unlimited generations and advanced features.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => router.push("/auth/signup")}>
              Get 2 Free Credits
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/auth/login")}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Generator Component */}
        <PublicImageGenerator />
      </main>
    </div>
  );
}
