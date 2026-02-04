"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import GeneratedImages from "@/components/image-generation/GeneratedImages";
import { PublicConfigurations } from "@/components/public-configurations";
import { SignupPromptDialog } from "@/components/signup-prompt-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFreeCRredits } from "@/hooks/use-free-credits";
import { createClient } from "@/lib/supabase";
import useGeneratedStore from "@/store/useGeneratedStore";
import { AlertCircle, Lock, Sparkles } from "lucide-react";

export function PublicImageGenerator() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const {
    creditsRemaining: hookCredits,
    isExhausted: hookExhausted,
    isLoading,
    useCredit,
  } = useFreeCRredits();
  const storeGenerationCount = useGeneratedStore(
    (state) => state.generationCount,
  );

  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  // Local state for credits to avoid stale closures
  const [creditsRemaining, setCreditsRemaining] = useState(hookCredits);
  const [isExhausted, setIsExhausted] = useState(hookExhausted);
  const [previousGenerationCount, setPreviousGenerationCount] = useState(0);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();
  }, [supabase]);

  // Sync hook values to local state
  useEffect(() => {
    setCreditsRemaining(hookCredits);
    setIsExhausted(hookExhausted);
  }, [hookCredits, hookExhausted]);

  // Monitor successful generations
  useEffect(() => {
    if (storeGenerationCount > previousGenerationCount) {
      setPreviousGenerationCount(storeGenerationCount);

      if (!user && creditsRemaining > 0) {
        const remaining = useCredit();
        setCreditsRemaining(remaining);

        if (remaining <= 0) {
          setIsExhausted(true);
          setTimeout(() => setShowSignupPrompt(true), 500);
        }
      }
    }
  }, [
    storeGenerationCount,
    previousGenerationCount,
    user,
    creditsRemaining,
    useCredit,
  ]);

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <>
      <SignupPromptDialog
        isOpen={showSignupPrompt}
        onOpenChange={setShowSignupPrompt}
      />

      <div className="space-y-6">
        {/* Credit Banner */}
        <Card
          className={
            isExhausted
              ? "border-red-500 bg-red-50 dark:bg-red-950"
              : "border-green-500 bg-green-50 dark:bg-green-950"
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5" />
                <div>
                  <p className="font-semibold">
                    Free Credits: {creditsRemaining} / 2
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isExhausted
                      ? "Sign in to unlock unlimited generations"
                      : `${creditsRemaining} free generation${creditsRemaining !== 1 ? "s" : ""} remaining`}
                  </p>
                </div>
              </div>
              {isExhausted && (
                <Button onClick={() => setShowSignupPrompt(true)}>
                  Sign In
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Image</CardTitle>
              <CardDescription>
                Create AI-generated images with just 2 free credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isExhausted ? (
                <div className="text-center py-8">
                  <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-semibold mb-4">Free credits exhausted</p>
                  <Button onClick={() => setShowSignupPrompt(true)}>
                    Sign Up to Continue
                  </Button>
                </div>
              ) : (
                <PublicConfigurations
                  onBeforeGenerate={() => {
                    if (user) {
                      router.push("/dashboard");
                      return false;
                    }
                    if (creditsRemaining <= 0) {
                      setShowSignupPrompt(true);
                      return false;
                    }
                    return true;
                  }}
                  onLockedClick={() => setShowSignupPrompt(true)}
                />
              )}
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Images</CardTitle>
            </CardHeader>
            <CardContent>
              <GeneratedImages blurred={!user && isExhausted} />
            </CardContent>
          </Card>
        </div>

        {/* Exhausted State */}
        {isExhausted && (
          <Card className="border-orange-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-900 dark:text-orange-100">
                    Free trial complete
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                    You've used your 2 free image generations. Sign in to your
                    account to continue generating with unlimited access!
                  </p>
                  <Button
                    className="mt-3"
                    onClick={() => setShowSignupPrompt(true)}
                  >
                    Sign Up to Continue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-100">
                    Error
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
