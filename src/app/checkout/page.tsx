"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { useCart } from "@/app/contexts/cartContexts"; // adjust path if needed
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Simple Checkout page:
 * - shows cart items and total
 * - collects name, phone, address
 * - on Place Order:
 *    1) verifies user logged in
 *    2) inserts order into `orders` table
 *    3) deletes cart row from `carts` table (server)
 *    4) clears local cart via clearCart()
 *    5) navigates to /order-success (or /orders)
 */

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, total, clearCart } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canPlace = cart.length > 0 && name.trim() && phone.trim() && address.trim();

  async function placeOrder() {
    setErrorMsg(null);

    if (!canPlace) {
      setErrorMsg("Please fill all shipping details and ensure cart is not empty.");
      return;
    }

    setLoading(true);

    try {
      // get current user
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userData?.user ?? null;
      if (!user) {
        setErrorMsg("You must be logged in to place an order. Please log in first.");
        setLoading(false);
        return;
      }

      // prepare order payload
      const orderPayload = {
        user_id: user.id,
        items: cart,
        total,
        shipping: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        },
        status: "pending",
      };

      // insert order into orders table
      const { data: insertData, error: insertErr } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select()
        .single();

      if (insertErr) {
        console.error("insert order error", insertErr);
        throw insertErr;
      }

      // clear server cart row (delete by user_id)
      // optional: you could upsert empty items too. We delete here for clarity.
      const { error: delErr } = await supabase.from("carts").delete().eq("user_id", user.id);
      if (delErr) {
        // not fatal — log and continue; but surface warning
        console.warn("Failed to delete server cart after placing order:", delErr);
      }

      // clear local cart
      try {
        clearCart();
      } catch (e) {
        console.warn("clearCart failed locally", e);
      }

      // navigate to success page or orders list
      router.push("/orders"); // create this route or replace with /orders
    } catch (e: any) {
      console.error("placeOrder error", e);
      setErrorMsg(e?.message ?? "Failed to place order. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-24 px-4">
      <h1 className="text-2xl font-semibold mb-4">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT: Shipping form */}
        <div>
          <div className="mb-3">
            <label className="block text-sm font-medium">Full name</label>
            <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="John Doe" />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium">Phone</label>
            <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium">Shipping address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 border rounded"
              rows={5}
              placeholder="House, Street, City, State, PIN"
            />
          </div>

          {errorMsg && <div className="text-sm text-red-600 mb-3">{errorMsg}</div>}

          <div className="flex gap-3">
            <Button onClick={placeOrder} disabled={!canPlace || loading}>
              {loading ? "Placing order…" : "Place Order"}
            </Button>

            <Button variant="ghost" onClick={() => router.push("/cart")} disabled={loading}>
              Back to cart
            </Button>
          </div>
        </div>

        {/* RIGHT: Order summary */}
        <aside className="p-4 border rounded">
          <h2 className="font-medium mb-3">Order Summary</h2>

          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <div className="space-y-3">
              {cart.map((it: any) => (
                <div key={it.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={it.image ?? "/placeholder.png"} alt={it.name} className="w-12 h-12 object-cover rounded" />
                    <div>
                      <div className="text-sm">{it.name}</div>
                      <div className="text-xs text-muted-foreground">Qty: {it.qty}</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium">₹{(it.price * it.qty).toFixed(2)}</div>
                </div>
              ))}

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between">
                  <div className="text-sm text-muted-foreground">Subtotal</div>
                  <div className="font-medium">₹{total.toFixed(2)}</div>
                </div>
                {/* optionally include shipping, tax */}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
