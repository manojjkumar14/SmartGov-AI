"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, LockKeyhole, ArrowLeft, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";

const Logo = () => (
  <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 border border-primary/20 text-primary text-2xl font-bold animate-pulse-slow">
    🛡
  </div>
);

export default function SignIn() {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);

  useEffect(() => {
    // Read the error message injected by Flask Jinja template from the hidden DOM element
    const errorEl = document.getElementById("login-error-message");
    if (errorEl) {
      const errorText = errorEl.getAttribute("data-error");
      if (errorText) {
        setErrorMessage(errorText);
      }
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      {/* Back to Home Button */}
      <a 
        href="/" 
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors bg-white px-4 py-2 rounded-xl border border-border shadow-sm"
      >
        <ArrowLeft className="size-4" />
        <span>Back Home</span>
      </a>

      <Card className="w-full max-w-md border border-border bg-card p-2 shadow-2xl shadow-navy/10 rounded-2xl">
        <CardHeader className="space-y-2 text-center mt-4">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-navy">Welcome Back 👋</h2>
            <p className="text-muted-foreground text-sm">
              Login to continue using SmartGov AI
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 px-6">
          {/* Flask Error Alert */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-destructive text-sm font-medium animate-shake">
              <ShieldAlert className="size-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Standard HTML Form Submission to connect to Flask auth backend */}
          <form action="/login" method="POST" className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <span className="absolute inset-y-0 start-0 flex items-center justify-center w-10 text-muted-foreground">
                  <Mail className="size-4.5" />
                </span>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  required
                  placeholder="Enter your email" 
                  className="ps-10 rounded-xl"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs font-semibold text-primary hover:text-primary-dark hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 start-0 flex items-center justify-center w-10 text-muted-foreground">
                  <LockKeyhole className="size-4.5" />
                </span>
                <Input
                  id="password"
                  name="password"
                  required
                  className="ps-10 pe-10 rounded-xl"
                  placeholder="Enter your password"
                  type={isPasswordVisible ? "text" : "password"}
                />
                <button
                  className="text-muted-foreground hover:text-foreground absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center rounded-e-md outline-none transition-colors"
                  type="button"
                  onClick={togglePasswordVisibility}
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  aria-pressed={isPasswordVisible}
                  aria-controls="password"
                >
                  {isPasswordVisible ? (
                    <EyeOff className="size-4.5" />
                  ) : (
                    <Eye className="size-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button className="w-full bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl py-5 mt-2 shadow shadow-primary/25 transition-all" type="submit">
              Login
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/80 !py-4 mt-2">
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/signup" className="text-primary hover:text-primary-dark font-semibold hover:underline">
              Sign Up
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
