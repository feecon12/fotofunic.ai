"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Info, Plus, Trash2, Zap } from "lucide-react";
import { useState } from "react";

export default function ModelsPage() {
  const [models] = useState([
    {
      id: "model-001",
      name: "My Portrait Model",
      status: "Ready",
      accuracy: 94,
      images: 250,
      created: "2026-01-10",
    },
    {
      id: "model-002",
      name: "Landscape Specialist",
      status: "Training",
      accuracy: null,
      images: 180,
      created: "2026-01-20",
    },
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Models</h1>
          <p className="text-muted-foreground mt-2">
            Train and manage your AI models
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Train New Model
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="flex gap-3 pt-6">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Pro tip</p>
            <p className="text-blue-800">
              Fine-tune models with your own images for better results. Each
              model uses approximately 100-500 images.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Models Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {models.map((model) => (
          <Card key={model.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{model.name}</CardTitle>
                  <CardDescription>Created {model.created}</CardDescription>
                </div>
                <Badge
                  className={
                    model.status === "Ready"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {model.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  {model.accuracy ? (
                    <p className="font-medium text-lg">{model.accuracy}%</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Training...</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Training Images
                  </p>
                  <p className="font-medium text-lg">{model.images}</p>
                </div>
              </div>
              {model.status === "Ready" && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1">
                    <Zap className="h-4 w-4 mr-1" />
                    Use Model
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Model Training Usage</CardTitle>
          <CardDescription>Your training quota this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Models trained this month</span>
                <span className="font-medium">2 / 5</span>
              </div>
              <div className="bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full" style={{ width: "40%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Training images used</span>
                <span className="font-medium">430 / 2000</span>
              </div>
              <div className="bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full"
                  style={{ width: "21.5%" }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
