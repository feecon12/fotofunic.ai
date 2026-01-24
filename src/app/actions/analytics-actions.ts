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
  tagBreakdown: { tag: string; count: number }[];
  hourlyActivity: { hour: number; count: number }[];
}

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface AnalyticsFilters {
  startDate?: string; // ISO date string (YYYY-MM-DD or full ISO)
  endDate?: string; // ISO date string
  model?: string;
  onlyFavorites?: boolean;
}

export async function getAnalytics(
  filters?: AnalyticsFilters,
): Promise<ActionResponse<AnalyticsData>> {
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

    // Fetch user images with optional filters
    let query = supabase
      .from("generated_images")
      .select("*")
      .eq("user_id", user.id);

    if (filters?.startDate) {
      // Accept either date-only or full ISO strings
      query = query.gte("created_at", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate);
    }
    if (filters?.model) {
      query = query.eq("model", filters.model);
    }
    if (filters?.onlyFavorites) {
      query = query.eq("is_favorite", true);
    }

    const { data: images, error } = await query;

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
      (img) => new Date(img.created_at) >= oneWeekAgo,
    ).length;

    // Images this month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const imagesThisMonth = allImages.filter(
      (img) => new Date(img.created_at) >= oneMonthAgo,
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

    // Recent activity over selected date range (default last 7 days)
    const endRef = filters?.endDate ? new Date(filters.endDate) : new Date();
    const startRef = filters?.startDate
      ? new Date(filters.startDate)
      : new Date(endRef);
    if (!filters?.startDate) {
      // ensure 7-day window by default
      startRef.setDate(startRef.getDate() - 6);
    }
    // Build day buckets inclusive
    const activityMap = new Map<string, number>();
    const current = new Date(startRef);
    while (current <= endRef) {
      const dateStr = current.toISOString().split("T")[0];
      activityMap.set(dateStr, 0);
      current.setDate(current.getDate() + 1);
    }

    allImages.forEach((img) => {
      const dateStr = img.created_at.split("T")[0];
      if (activityMap.has(dateStr)) {
        activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
      }
    });

    const recentActivity = Array.from(activityMap.entries()).map(
      ([date, count]) => ({ date, count }),
    );

    // Tag breakdown
    const tagCounts = new Map<string, number>();
    allImages.forEach((img) => {
      const tags = Array.isArray(img.tags) ? img.tags : [];
      tags.forEach((t: string) => {
        const tag = (t || "").trim();
        if (!tag) return;
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    const tagBreakdown = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    // Hourly activity (0-23)
    const hourly = new Array(24).fill(0) as number[];
    allImages.forEach((img) => {
      const d = new Date(img.created_at);
      const hour = d.getHours();
      if (hour >= 0 && hour <= 23) {
        hourly[hour] += 1;
      }
    });
    const hourlyActivity = hourly.map((count, hour) => ({ hour, count }));

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
        tagBreakdown,
        hourlyActivity,
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
