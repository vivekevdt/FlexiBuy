"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient"; // make sure this is the browser client createClient(...)
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignIn(e: any) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // debug logs (view in browser console)
      console.log("supabase.signInWithPassword returned:", { data, error });

      if (error) {
        // explicit error from supabase (wrong password, user not found, etc.)
        alert(error.message || "Sign in failed");
        setLoading(false);
        return;
      }

      // Cases:
      // 1) data.session exists → user is signed in (good)
      // 2) data.user exists but session is null → sometimes happens with magic-link or if email confirmation required
      // 3) both null → unexpected, show generic message

      if (data?.session) {
        // successful login
        // you can access data.session.user as data.session.user or data.user
        console.log("Signed in, session:", data.session);
        router.replace("/products");
        return;
      }

      // No session present — handle common flows:
      if (data?.user && !data?.session) {
        // This can occur if sign-in method requires email confirmation or is a magic link flow
        alert("Check your email for a confirmation link (magic link) or verify your account before signing in.");
        setLoading(false);
        return;
      }

      // Fallback: nothing useful returned
      alert("Sign in did not complete. Please check your credentials or try again.");
    } catch (err: any) {
      console.error("Unexpected sign-in error:", err);
      alert(err?.message ?? "Unexpected error during sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
