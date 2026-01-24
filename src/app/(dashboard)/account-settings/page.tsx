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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase";
import { AlertCircle, Bell, Lock, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function AccountSettingsPage() {
  const supabase = createClient();
  const { toast } = useToast();

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Notifications state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const isLoadedRef = useRef(false);

  // Load user data on mount
  useEffect(() => {
    if (isLoadedRef.current) return;
    isLoadedRef.current = true;

    const loadUserData = async () => {
      try {
        const {
          data: { user },
        } = await createClient().auth.getUser();
        if (user) {
          setEmail(user.email || "");
          setName(user.user_metadata?.name || "");
          setBio(user.user_metadata?.bio || "");
          setEmailNotifications(
            user.user_metadata?.email_notifications ?? true,
          );
          setWeeklyDigest(user.user_metadata?.weekly_digest ?? true);
          setMarketingEmails(user.user_metadata?.marketing_emails ?? false);
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: name.trim(),
          bio: bio.trim(),
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    } catch (error) {
      console.error("Password update error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update password";
      setPasswordError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          email_notifications: emailNotifications,
          weekly_digest: weeklyDigest,
          marketing_emails: marketingEmails,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification preferences saved",
      });
    } catch (error) {
      console.error("Notification update error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update preferences",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and preferences
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Loading...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <div>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  type="text"
                  placeholder="Tell us about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>
                    Manage your password and authentication
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordError && (
                <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{passwordError}</p>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button
                onClick={handleUpdatePassword}
                disabled={isSavingPassword}
              >
                {isSavingPassword ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Manage your notification preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-normal">
                  Email notifications for new images
                </Label>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Weekly digest</Label>
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Marketing emails</Label>
                <input
                  type="checkbox"
                  checked={marketingEmails}
                  onChange={(e) => setMarketingEmails(e.target.checked)}
                  className="rounded"
                />
              </div>
              <Button
                onClick={handleSaveNotifications}
                disabled={isSavingNotifications}
                className="mt-2"
              >
                {isSavingNotifications ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
