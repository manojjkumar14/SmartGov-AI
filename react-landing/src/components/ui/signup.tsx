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
import { Eye, EyeOff, Mail, LockKeyhole, User, ArrowLeft, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";

const Logo = () => (
  <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 border border-primary/20 text-primary text-2xl font-bold animate-pulse-slow">
    🛡
  </div>
);

export default function SignUp() {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState<boolean>(false);
  const [fullname, setFullname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);
  const toggleConfirmVisibility = () => setIsConfirmVisible((prev) => !prev);

  useEffect(() => {
    // Read the error message injected by Flask Jinja template from the hidden DOM element
    const errorEl = document.getElementById("signup-error-message");
    if (errorEl) {
      const errorText = errorEl.getAttribute("data-error");
      if (errorText) {
        setErrorMessage(errorText);
      }
    }
  }, []);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (password !== confirmPassword) {
      e.preventDefault();
      setErrorMessage("Passwords do not match!");
    }
  };

  // Border feedback for password matching
  const confirmPasswordBorderClass = confirmPassword
    ? password === confirmPassword
      ? "border-green-600 focus-visible:ring-green-600/20"
      : "border-destructive focus-visible:ring-destructive/20"
    : "";

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 py-8">
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
            <h2 className="text-2xl font-bold tracking-tight text-navy">Create your account</h2>
            <p className="text-muted-foreground text-sm">
              Join SmartGov AI to discover government schemes
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 px-6">
          {/* Flask / Client Validation Error Alert */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-destructive text-sm font-medium animate-shake">
              <ShieldAlert className="size-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Standard HTML Form Submission to connect to Flask signup backend */}
          <form action="/signup" method="POST" onSubmit={handleFormSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullname">Full Name</Label>
              <div className="relative">
                <span className="absolute inset-y-0 start-0 flex items-center justify-center w-10 text-muted-foreground">
                  <User className="size-4.5" />
                </span>
                <Input 
                  id="fullname" 
                  name="fullname"
                  type="text" 
                  required
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Enter your full name" 
                  className="ps-10 rounded-xl"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <span className="absolute inset-y-0 start-0 flex items-center justify-center w-10 text-muted-foreground">
                  <Mail className="size-4.5" />
                </span>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email" 
                  className="ps-10 rounded-xl"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <span className="absolute inset-y-0 start-0 flex items-center justify-center w-10 text-muted-foreground">
                  <LockKeyhole className="size-4.5" />
                </span>
                <Input
                  id="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ps-10 pr-10 rounded-xl"
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

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <span className="absolute inset-y-0 start-0 flex items-center justify-center w-10 text-muted-foreground">
                  <LockKeyhole className="size-4.5" />
                </span>
                <Input
                  id="confirmPassword"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`ps-10 pr-10 rounded-xl transition-shadow ${confirmPasswordBorderClass}`}
                  placeholder="Confirm your password"
                  type={isConfirmVisible ? "text" : "password"}
                />
                <button
                  className="text-muted-foreground hover:text-foreground absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center rounded-e-md outline-none transition-colors"
                  type="button"
                  onClick={toggleConfirmVisibility}
                  aria-label={isConfirmVisible ? "Hide password" : "Show password"}
                  aria-pressed={isConfirmVisible}
                  aria-controls="confirmPassword"
                >
                  {isConfirmVisible ? (
                    <EyeOff className="size-4.5" />
                  ) : (
                    <Eye className="size-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms Acceptance */}
            <div className="flex items-center space-x-2.5 pt-1">
              <Checkbox id="terms" />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-normal">
                I agree to the{" "}
                <a href="#" className="text-primary hover:text-primary-dark font-semibold hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:text-primary-dark font-semibold hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <Button className="w-full bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl py-5 mt-3 shadow shadow-primary/25 transition-all" type="submit">
              Create Account
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/80 !py-4 mt-2">
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:text-primary-dark font-semibold hover:underline">
              Login
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
