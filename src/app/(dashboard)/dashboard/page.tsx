"use client";

import { getAnalytics } from "@/app/actions/analytics-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Image as ImageIcon, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface AnalyticsData {
  totalImages: number;
  totalFavorites: number;
  imagesThisWeek: number;
  imagesThisMonth: number;
  topModel: { name: string; count: number } | null;
  modelBreakdown: { model: string; count: number }[];
  aspectRatioBreakdown: { ratio: string; count: number }[];
  recentActivity: { date: string; count: number }[];
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      const { success, data } = await getAnalytics();
      if (success && data) {
        setAnalytics(data);
      }
      setLoading(false);
    };
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Failed to load analytics</p>
      </div>
    );
  }

  const maxActivity = Math.max(...analytics.recentActivity.map((a) => a.count), 1);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track your image generation activity and insights
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Images */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalImages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.imagesThisMonth} this month
            </p>
          </CardContent>
        </Card>

        {/* Favorites */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalFavorites}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.totalImages > 0
                ? Math.round((analytics.totalFavorites / analytics.totalImages) * 100)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.imagesThisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Images generated
            </p>
          </CardContent>
        </Card>

        {/* Top Model */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Model</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.topModel
                ? analytics.topModel.name.split("/")[1] || analytics.topModel.name
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.topModel ? `${analytics.topModel.count} images` : "No images yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.recentActivity.map((activity) => (
                <div key={activity.date} className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground w-20">
                    {new Date(activity.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-primary h-full flex items-center justify-end px-2 transition-all"
                      style={{
                        width: `${(activity.count / maxActivity) * 100}%`,
                      }}
                    >
                      {activity.count > 0 && (
                        <span className="text-xs text-primary-foreground font-medium">
                          {activity.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Model Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Model Usage</CardTitle>
            <p className="text-sm text-muted-foreground">Top 5 models</p>
          </CardHeader>
          <CardContent>
            {analytics.modelBreakdown.length > 0 ? (
              <div className="space-y-3">
                {analytics.modelBreakdown.map((model) => (
                  <div key={model.model}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium truncate max-w-[200px]">
                        {model.model.split("/")[1] || model.model}
                      </span>
                      <span className="text-muted-foreground">
                        {model.count} ({Math.round((model.count / analytics.totalImages) * 100)}
                        %)
                      </span>
                    </div>
                    <div className="bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{
                          width: `${(model.count / analytics.totalImages) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No models used yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aspect Ratios */}
      <Card>
        <CardHeader>
          <CardTitle>Aspect Ratio Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {analytics.aspectRatioBreakdown.map((ratio) => (
              <div
                key={ratio.ratio}
                className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md"
              >
                <span className="font-medium">{ratio.ratio}</span>
                <span className="text-sm text-muted-foreground">
                  {ratio.count} ({Math.round((ratio.count / analytics.totalImages) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
