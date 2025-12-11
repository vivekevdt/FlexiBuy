"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Menu, X } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/app/contexts/cartContexts";

export default function Header({ user, loading }: { user: any; loading?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const { count, clearCart } = useCart();

  const categories = ["electronics", "clothes", "home", "books", "shoes", "sports", "beauty"];

  async function logout() {
    try {
      clearCart();
      await supabase.auth.signOut();
      router.refresh();
    } catch (err) {
      console.error("logout error", err);
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white shadow">
      <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 h-14">

        {/* Logo */}
        <Link href="/" className="text-xl font-bold">FlexiBuy</Link>

        {/* Categories (Desktop) */}
        <div className="hidden sm:flex flex-1 items-center overflow-x-auto gap-2 px-2">
          {categories.map((c) => (
            <Link
              key={c}
              href={`/products?category=${c}`}
              className="text-sm px-3 py-1 rounded hover:bg-gray-100 whitespace-nowrap"
            >
              {c}
            </Link>
          ))}
        </div>

        {/* Spacer for mobile */}
        <div className="flex-1 sm:hidden" />

        {/* Right Side Actions */}
        <nav className="flex items-center gap-3">
          
          {/* Cart Button */}
          <button
            aria-label="Open cart"
            onClick={() => router.push("/cart")}
            className="relative p-2 rounded hover:bg-gray-100"
          >
            <ShoppingCart className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs px-1.5 py-0.5">
                {count}
              </span>
            )}
          </button>

          {/* Desktop Auth Links */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <>
                {/* 👇 REPLACED EMAIL WITH ORDERS BUTTON */}
                <Link href="/orders">
                  <Button variant="secondary">Orders</Button>
                </Link>

                <Button variant="destructive" onClick={logout}>Logout</Button>
              </>
            ) : (
              <>
                <Link href="/auth/sign-in">
                  <Button>Login</Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button variant="outline">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Hamburger (Mobile) */}
          <button
            className="sm:hidden p-2 rounded hover:bg-gray-100"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </nav>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="sm:hidden bg-white border-t shadow-md w-full fixed left-0 top-14 z-40">
          <div className="px-4 py-4 space-y-4">

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c}
                  href={`/products?category=${c}`}
                  onClick={() => setOpen(false)}
                  className="text-sm px-3 py-1 rounded bg-gray-50 hover:bg-gray-100"
                >
                  {c}
                </Link>
              ))}
            </div>

            {/* Mobile Auth Section */}
            <div className="flex flex-col gap-2 pt-2 border-t">
              <Link href="/products" onClick={() => setOpen(false)} className="py-2">All Products</Link>

              {user ? (
                <>
                  {/* 👇 ADDED ORDERS LINK FOR MOBILE */}
                  <Link href="/orders" onClick={() => setOpen(false)} className="py-2">
                    <Button className="w-full">Orders</Button>
                  </Link>

                  <Button onClick={() => { logout(); setOpen(false); }}>Logout</Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth/sign-in" onClick={() => setOpen(false)} className="flex-1">
                    <Button className="w-full">Login</Button>
                  </Link>
                  <Link href="/auth/sign-up" onClick={() => setOpen(false)} className="flex-1">
                    <Button variant="outline" className="w-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
