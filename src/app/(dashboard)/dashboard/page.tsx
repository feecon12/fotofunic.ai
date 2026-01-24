"use client";

import { getAnalytics } from "@/app/actions/analytics-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface AnalyticsData {
  totalImages: number;
  totalFavorites: number;
  imagesThisWeek: number;
  imagesThisMonth: number;
  topModel: { name: string; count: number } | null;
  modelBreakdown: { model: string; count: number }[];
  aspectRatioBreakdown: { ratio: string; count: number }[];
  recentActivity: { date: string; count: number }[];
  tagBreakdown: { tag: string; count: number }[];
  hourlyActivity: { hour: number; count: number }[];
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  // Filters
  const [range, setRange] = useState<"7d" | "30d" | "all" | "custom">("7d");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

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

  const computedDates = useMemo(() => {
    const now = new Date();
    const toISODate = (d: Date) => d.toISOString();
    if (range === "7d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { start: toISODate(start), end: toISODate(now) };
    }
    if (range === "30d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { start: toISODate(start), end: toISODate(now) };
    }
    if (range === "custom") {
      return {
        start: startDate ? new Date(startDate).toISOString() : undefined,
        end: endDate ? new Date(endDate).toISOString() : undefined,
      };
    }
    return { start: undefined, end: undefined };
  }, [range, startDate, endDate]);

  const applyFilters = async () => {
    setApplying(true);
    const { success, data } = await getAnalytics({
      startDate: computedDates.start,
      endDate: computedDates.end,
      model: model || undefined,
      onlyFavorites,
    });
    if (success && data) {
      setAnalytics(data);
    }
    setApplying(false);
  };

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

  const maxActivity = Math.max(
    ...analytics.recentActivity.map((a) => a.count),
    1,
  );

  // Export helpers for weekly trend (recentActivity)
  const exportTrendCSV = () => {
    const rows = [
      "date,count",
      ...analytics.recentActivity.map((a) => `${a.date},${a.count}`),
    ];
    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "weekly-trend.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportTrendPNG = () => {
    const width = 640;
    const height = 240;
    const pad = 30;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim() || "#fff";
    ctx.fillRect(0, 0, width, height);

    // Axes
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, height - pad);
    ctx.lineTo(width - pad, height - pad);
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, height - pad);
    ctx.stroke();

    const maxY = Math.max(...analytics.recentActivity.map((a) => a.count), 1);
    const points = analytics.recentActivity.map((a, i) => {
      const x =
        pad +
        (i / Math.max(analytics.recentActivity.length - 1, 1)) *
          (width - pad * 2);
      const y = height - pad - (a.count / maxY) * (height - pad * 2);
      return { x, y, a };
    });

    // Line
    ctx.strokeStyle = "#3b82f6"; // blue-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Points
    ctx.fillStyle = "#3b82f6";
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // X labels
    ctx.fillStyle = "#6b7280"; // gray-500
    ctx.font = "10px sans-serif";
    points.forEach((p, i) => {
      const d = new Date(p.a.date);
      const label = `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      ctx.fillText(label, p.x - 14, height - pad + 12);
    });

    // Y labels (0 and max)
    ctx.fillText("0", pad - 16, height - pad + 4);
    ctx.fillText(String(maxY), pad - 16, pad + 4);

    // Download
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "weekly-trend.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export full analytics summary to CSV
  const exportAnalyticsCSV = () => {
    const lines: string[] = [];
    const add = (l: string) => lines.push(l);
    add("metric,value");
    add(`totalImages,${analytics.totalImages}`);
    add(`totalFavorites,${analytics.totalFavorites}`);
    add(`imagesThisWeek,${analytics.imagesThisWeek}`);
    add(`imagesThisMonth,${analytics.imagesThisMonth}`);
    add(`topModel,${analytics.topModel ? analytics.topModel.name : ""}`);
    add("");
    add("model,count");
    analytics.modelBreakdown.forEach((m) => add(`${m.model},${m.count}`));
    add("");
    add("aspectRatio,count");
    analytics.aspectRatioBreakdown.forEach((r) => add(`${r.ratio},${r.count}`));
    add("");
    add("date,count");
    analytics.recentActivity.forEach((d) => add(`${d.date},${d.count}`));
    add("");
    add("tag,count");
    analytics.tagBreakdown.forEach((t) => add(`${t.tag},${t.count}`));
    add("");
    add("hour,count");
    analytics.hourlyActivity.forEach((h) => add(`${h.hour},${h.count}`));

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analytics-summary.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track your image generation activity and insights
        </p>
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={exportAnalyticsCSV}>
            Export Analytics CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={range} onValueChange={(v) => setRange(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {range === "custom" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            )}

            {range === "custom" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Type exact model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
                <Select onValueChange={(v) => setModel(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose detected" />
                  </SelectTrigger>
                  <SelectContent>
                    {analytics?.modelBreakdown.map((m) => (
                      <SelectItem key={m.model} value={m.model}>
                        {m.model.split("/")[1] || m.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={onlyFavorites}
                onCheckedChange={(v) => setOnlyFavorites(Boolean(v))}
                id="fav-only"
              />
              <label htmlFor="fav-only" className="text-sm">
                Only favorites
              </label>
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <Button onClick={applyFilters} disabled={applying}>
                {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
                ? Math.round(
                    (analytics.totalFavorites / analytics.totalImages) * 100,
                  )
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
                ? analytics.topModel.name.split("/")[1] ||
                  analytics.topModel.name
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.topModel
                ? `${analytics.topModel.count} images`
                : "No images yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily Trend Line */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Trend</CardTitle>
              <p className="text-sm text-muted-foreground">
                Daily images — last {analytics.recentActivity.length} days
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportTrendCSV}>
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportTrendPNG}>
                Export PNG
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <svg width="100%" height="180" viewBox="0 0 640 180">
              <defs>
                <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Axes */}
              <line
                x1="30"
                y1="150"
                x2="610"
                y2="150"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <line
                x1="30"
                y1="20"
                x2="30"
                y2="150"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              {(() => {
                const maxY = Math.max(
                  ...analytics.recentActivity.map((a) => a.count),
                  1,
                );
                const pts = analytics.recentActivity.map((a, i) => {
                  const x =
                    30 +
                    (i / Math.max(analytics.recentActivity.length - 1, 1)) *
                      (610 - 30);
                  const y = 150 - (a.count / maxY) * (150 - 20);
                  return { x, y, a };
                });
                const path = pts
                  .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
                  .join(" ");
                return (
                  <g>
                    <path
                      d={path}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    {/* Points */}
                    {pts.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={3} fill="#3b82f6" />
                    ))}
                    {/* X labels */}
                    {pts.map((p, i) => (
                      <text
                        key={`xl-${i}`}
                        x={p.x - 14}
                        y={166}
                        fontSize="10"
                        fill="#6b7280"
                      >
                        {new Date(p.a.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </text>
                    ))}
                    {/* Y labels */}
                    <text x={10} y={154} fontSize="10" fill="#6b7280">
                      0
                    </text>
                    <text x={10} y={26} fontSize="10" fill="#6b7280">
                      {maxY}
                    </text>
                  </g>
                );
              })()}
            </svg>
          </CardContent>
        </Card>
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last {analytics.recentActivity.length} days
            </p>
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
                        {model.count} (
                        {Math.round(
                          (model.count / analytics.totalImages) * 100,
                        )}
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
              <p className="text-sm text-muted-foreground">
                No models used yet
              </p>
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
                  {ratio.count} (
                  {Math.round((ratio.count / analytics.totalImages) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tag Usage and Time of Day */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Tag Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Tag Usage</CardTitle>
            <p className="text-sm text-muted-foreground">Top tags</p>
          </CardHeader>
          <CardContent>
            {analytics.tagBreakdown.length > 0 ? (
              <div className="space-y-3">
                {analytics.tagBreakdown.slice(0, 10).map((t) => (
                  <div key={t.tag}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium truncate max-w-[200px]">
                        {t.tag}
                      </span>
                      <span className="text-muted-foreground">
                        {t.count} (
                        {Math.round((t.count / analytics.totalImages) * 100)}%)
                      </span>
                    </div>
                    <div className="bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{
                          width: `${(t.count / analytics.totalImages) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags yet</p>
            )}
          </CardContent>
        </Card>

        {/* Time of Day */}
        <Card>
          <CardHeader>
            <CardTitle>Time of Day</CardTitle>
            <p className="text-sm text-muted-foreground">Generation by hour</p>
          </CardHeader>
          <CardContent>
            {analytics.hourlyActivity.some((h) => h.count > 0) ? (
              <div className="flex items-end gap-2 h-40">
                {analytics.hourlyActivity.map((h) => (
                  <div
                    key={h.hour}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="bg-primary w-4 rounded-sm"
                      style={{
                        height: `${(h.count / Math.max(...analytics.hourlyActivity.map((x) => x.count), 1)) * 100}%`,
                      }}
                      title={`${h.hour}:00 — ${h.count}`}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {h.hour}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
