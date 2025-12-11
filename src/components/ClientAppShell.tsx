"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import Header from "./Header";
import { Suspense } from "react";
// import { CartProvider } from "@/contexts/CartContext"; // optional, keep or remove if you don't have it

export default function ClientAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // read initial user
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data?.user ?? null);


      } catch (err) {
        console.error("supabase getUser error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // subscribe to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        console.log(session?.user);
      }
    );

  }, []);
  console.log("render")

  // while loading you can render a skeleton header or null
  return (
    <>
      {/* Header receives user and renders login/logout */}
      <Header user={user} />

      {/* Main content */}
      <main className="pt-20">{children}</main>
    </>
  );
}
