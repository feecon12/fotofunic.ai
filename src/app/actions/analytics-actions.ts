"use server";

import { createServerClientComponent } from "@/lib/supabase-server";

interface AnalyticsData {
  totalImages: number;
  totalFavorites: number;
  imagesThisWeek: number;
  imagesThisMonth: number;
  topModel: { name: string; count: number } | null;
  modelBreakdown: { model: string; count: number }[];
  aspectRatioBreakdown: { ratio: string; count: number }[];
  recentActivity: {
    date: string;
    count: number;
  }[];
}

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getAnalytics(): Promise<ActionResponse<AnalyticsData>> {
  try {
    const supabase = await createServerClientComponent();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Fetch all user images
    const { data: images, error } = await supabase
      .from("generated_images")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      return {
        success: false,
        error: error.message || "Failed to fetch analytics",
      };
    }

    const allImages = images || [];

    // Calculate stats
    const totalImages = allImages.length;
    const totalFavorites = allImages.filter((img) => img.is_favorite).length;

    // Images this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const imagesThisWeek = allImages.filter(
      (img) => new Date(img.created_at) >= oneWeekAgo
    ).length;

    // Images this month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const imagesThisMonth = allImages.filter(
      (img) => new Date(img.created_at) >= oneMonthAgo
    ).length;

    // Model breakdown
    const modelCounts = new Map<string, number>();
    allImages.forEach((img) => {
      const model = img.model || "Unknown";
      modelCounts.set(model, (modelCounts.get(model) || 0) + 1);
    });

    const modelBreakdown = Array.from(modelCounts.entries())
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count);

    const topModel =
      modelBreakdown.length > 0
        ? { name: modelBreakdown[0].model, count: modelBreakdown[0].count }
        : null;

    // Aspect ratio breakdown
    const ratioCounts = new Map<string, number>();
    allImages.forEach((img) => {
      const ratio = img.aspect_ratio || "Unknown";
      ratioCounts.set(ratio, (ratioCounts.get(ratio) || 0) + 1);
    });

    const aspectRatioBreakdown = Array.from(ratioCounts.entries())
      .map(([ratio, count]) => ({ ratio, count }))
      .sort((a, b) => b.count - a.count);

    // Recent activity (last 7 days)
    const activityMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      activityMap.set(dateStr, 0);
    }

    allImages.forEach((img) => {
      const dateStr = img.created_at.split("T")[0];
      if (activityMap.has(dateStr)) {
        activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
      }
    });

    const recentActivity = Array.from(activityMap.entries()).map(
      ([date, count]) => ({ date, count })
    );

    return {
      success: true,
      data: {
        totalImages,
        totalFavorites,
        imagesThisWeek,
        imagesThisMonth,
        topModel,
        modelBreakdown: modelBreakdown.slice(0, 5), // Top 5 models
        aspectRatioBreakdown,
        recentActivity,
      },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}
