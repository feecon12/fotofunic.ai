"use server";

import { createClient } from "@/lib/supabase/server";

interface AuthResponse {
  error: null | string;
  success: boolean;
  data: unknown | null;
}
export async function signup(formdata: FormData): Promise<AuthResponse> {
  const supabase = await createClient();

  const email = formdata.get("email");
  const password = formdata.get("password");
  const fullName = formdata.get("fullName");

  if (typeof email !== "string" || typeof password !== "string") {
    return {
      error: "Email and password are required.",
      success: false,
      data: null,
    };
  }

  const signUpData = {
    email,
    password,
    options: {
      data: {
        fullName: typeof fullName === "string" ? fullName : "",
      },
    },
  };

  const { data: signupData, error } = await supabase.auth.signUp(signUpData);

  return {
    error: error?.message || "There was an error signin up!",
    success: !error,
    data: signupData || null,
  };
}
