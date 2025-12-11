'use client';

import { useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");   // NEW
  const router = useRouter();

  async function handleSignUp(e: any) {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return alert(error.message);

    // If email confirmation is ON, Supabase does NOT log user in
    if (data?.user && !data.session) {
      setMessage("A verification link has been sent to your email. Please verify before logging in.");
      return; // STAY on signup page
    }

    // If email verification is OFF, user will be logged in immediately
    router.push("/products");
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <Card>
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button type="submit" className="w-full">Sign Up</Button>
          </form>

          {message && (
            <p className="text-center text-sm text-blue-600 mt-3">
              {message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
