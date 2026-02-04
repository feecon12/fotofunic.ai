import { useEffect, useState } from "react";

const STORAGE_KEY = "fotofunic_free_credits";
const FREE_CREDITS = 2;

export function useFreeCRredits() {
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setCreditsUsed(stored ? parseInt(stored, 10) : 0);
    } catch {
      setCreditsUsed(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const creditsRemaining = Math.max(0, FREE_CREDITS - creditsUsed);
  const isExhausted = creditsRemaining === 0;

  const useCredit = () => {
    if (isExhausted) return 0;
    const newUsed = creditsUsed + 1;
    setCreditsUsed(newUsed);
    try {
      localStorage.setItem(STORAGE_KEY, String(newUsed));
    } catch {
      // Silent fail if localStorage unavailable
    }
    const remaining = Math.max(0, FREE_CREDITS - newUsed);
    return remaining;
  };

  const resetCredits = () => {
    setCreditsUsed(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silent fail
    }
  };

  return {
    creditsUsed,
    creditsRemaining,
    isExhausted,
    useCredit,
    resetCredits,
    isLoading,
  };
}
