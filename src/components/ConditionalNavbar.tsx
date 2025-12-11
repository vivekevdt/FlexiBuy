// components/ConditionalNavbar.tsx
"use client";

import Link from "next/link";

export default function ConditionalNavbar({ user, loading }: { user: any; loading?: boolean }) {


  if (loading) {
    return (
      <div className="w-full bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2"> {/* simple placeholder */} </div>
      </div>
    );
  }

  if (user) {
    // logged-in navbar (example: categories + quick links)
    const categories = ["electronics", "clothes", "home", "books", "shoes"];
    return (
      <div className="w-full bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex gap-3 overflow-x-auto">
            {categories.map((c) => (
              <Link key={c} href={`/products?category=${c}`} className="text-sm px-3 py-1 rounded hover:bg-gray-100">
                {c}
              </Link>
            ))}
          </div>
          <div className="text-sm">
            <Link href="/account" className="mr-4">My Account</Link>
            <Link href="/orders">Orders</Link>
          </div>
        </div>
      </div>
    );
  }

  // guest navbar (promo + sign-in)
  return (
    <div className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-sm">Free shipping over ₹999 — sign in for orders & wishlist</div>
        <div>
          <Link href="/auth/sign-in" className="text-sm underline">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
