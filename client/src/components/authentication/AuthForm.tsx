"use client";
import React, { useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { Button } from "../ui/button";
import ForgetpasswordForm from "./ForgetpasswordForm";
import Link from "next/link";

const AuthForm = () => {
  const [mode, setMode] = useState("login");
  return (
    <div className="space-y-6 ">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "reset"
            ? "Reset password"
            : mode === "login"
            ? "Login"
            : "Sign Up"}
        </h1>

        <p className="text-sm text-muted-foreground">
          {mode === "reset"
            ? "Enter your email below to reset password"
            : mode === "login"
            ? "Enter your email below to login to you account "
            : "Enter your information below below to create an account"}
        </p>
      </div>
      {mode == "login" && (
        <>
          <LoginForm />
          <div className="text-center flex justify-between">
            <Button
              variant={"link"}
              className="p-0"
              onClick={() => setMode("signup")}
            >
              Need an account? Sign up
            </Button>
            <Button
              variant={"link"}
              className="p-0"
              onClick={() => setMode("reset")}
            >
              Forgot password?
            </Button>
          </div>
        </>
      )}
      {mode == "signup" && (
        <>
          <SignupForm />
          <div className="text-center">
            <Button
              variant={"link"}
              className="p-0"
              onClick={() => setMode("login")}
            >
              Already have an account? Log in
            </Button>
            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking sign up, you agree to our{" "}
              <Link
                href="#"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </>
      )}
      {mode == "reset" && (
        <>
          <ForgetpasswordForm />
          <div className="text-center">
            <Button
              variant={"link"}
              className="p-0"
              onClick={() => setMode("login")}
            >
              Back to login
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AuthForm;
