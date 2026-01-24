"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { useState } from "react";

export default function ModelTrainingPage() {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  const handleStartTraining = () => {
    setIsTraining(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => setIsTraining(false), 1000);
      }
      setTrainingProgress(Math.floor(progress));
    }, 800);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Model Training</h1>
        <p className="text-muted-foreground mt-2">
          Train a custom model with your images
        </p>
      </div>

      {/* Training Steps */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Prepare Images</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Gather 50-500 images of your subject for best results
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Upload & Configure</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Upload images and configure training parameters
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Train</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Start training (typically 15-60 minutes)
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Training Images</CardTitle>
          <CardDescription>Upload 50-500 high-quality images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium mb-1">Drag and drop images here</p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <Button variant="outline">Browse Files</Button>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>✓ Supported formats: JPG, PNG, WebP</p>
            <p>✓ Recommended size: 512x512 - 1024x1024</p>
            <p>✓ File size limit: 50MB per image</p>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Training Configuration</CardTitle>
          <CardDescription>Customize your model training</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="model-name">Model Name</Label>
            <Input id="model-name" placeholder="e.g., My Portrait Model" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What does this model specialize in?"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="epochs">Training Epochs</Label>
              <Input id="epochs" type="number" defaultValue="1000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="learning-rate">Learning Rate</Label>
              <Input
                id="learning-rate"
                type="number"
                defaultValue="0.0001"
                step="0.0001"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Progress */}
      {isTraining && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Training in Progress
            </CardTitle>
            <CardDescription>
              This will take approximately 20-40 minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Progress</span>
                <span>{trainingProgress}%</span>
              </div>
              <div className="bg-white rounded-full h-3 overflow-hidden border border-blue-200">
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated time remaining: ~
              {40 - Math.floor(trainingProgress * 0.4)} minutes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleStartTraining} disabled={isTraining} size="lg">
          {isTraining ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Training...
            </>
          ) : (
            "Start Training"
          )}
        </Button>
        <Button variant="outline" size="lg" disabled={isTraining}>
          Clear
        </Button>
      </div>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Use diverse images with different angles and lighting</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Keep image quality consistent (no blurry or low-res)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>100-200 images typically yields best results</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Test the model before using it on important projects</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
