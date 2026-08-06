import React, { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "react-oidc-context";
import { registerUser } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Ticket, ArrowRight, Loader2 } from "lucide-react";

const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { signinRedirect } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToLogin = () => {
    signinRedirect();
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Ticket className="w-5 h-5 text-zinc-950 font-bold" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              Ticket<span className="text-amber-500">ra</span>
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-zinc-100">Create your account</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Join Ticketra to discover events, buy tickets, or organize your own
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-zinc-900/60 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-500/30 text-red-300">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertTitle>Registration Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-100">Account Created Successfully!</h2>
              <p className="text-sm text-zinc-400">
                Your account for <strong className="text-zinc-200">{email}</strong> is ready. You can now log in to access Ticketra.
              </p>
              <Button
                onClick={handleProceedToLogin}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-semibold shadow-lg shadow-amber-500/20 py-2.5 transition-all flex items-center justify-center gap-2"
              >
                Log In to Ticketra
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium text-zinc-300">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-zinc-950/60 border-white/[0.08] focus:border-amber-500 text-zinc-100 placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-zinc-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-zinc-950/60 border-white/[0.08] focus:border-amber-500 text-zinc-100 placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-zinc-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-zinc-950/60 border-white/[0.08] focus:border-amber-500 text-zinc-100 placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-zinc-300">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-zinc-950/60 border-white/[0.08] focus:border-amber-500 text-zinc-100 placeholder:text-zinc-600"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-semibold shadow-lg shadow-amber-500/20 py-2.5 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}

          {/* Footer Navigation Link */}
          {!isSuccess && (
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-center text-xs text-zinc-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => signinRedirect()}
                className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-4"
              >
                Log In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
