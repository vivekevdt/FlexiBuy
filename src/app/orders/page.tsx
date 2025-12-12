// app/orders/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient"; // adjust path if needed
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type OrderItem = {
  id: string;
  name?: string;
  price: number;
  qty: number;
  image?: string;
};

type Order = {
  id: string;
  user_id?: string;
  items: OrderItem[];
  total: number;
  shipping?: { name?: string; phone?: string; address?: string };
  status?: string;
  created_at?: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function fetchOrders() {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;

      const user = sessionData?.session?.user ?? null;
      if (!user) {
        setOrders([]);
        setError("You must be logged in to view orders.");
        setLoading(false);
        return;
      }

      const { data, error: qErr } = await supabase
        .from("orders")
        .select("id, items, total, shipping, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (qErr) throw qErr;

      setOrders((data as Order[]) ?? []);
    } catch (e: any) {
      console.error("fetch orders failed", e);
      setError(e?.message ?? "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4">
        <p>Loading orders…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4">
        <p className="text-red-600">Error: {error}</p>
        <div className="mt-4">
          <Button onClick={fetchOrders}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-24 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Orders</h1>
        <div>
          <Button onClick={fetchOrders} variant="outline">Refresh</Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <p>You have no orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-500">
                    {order.created_at
                      ? format(new Date(order.created_at), "PPP p")
                      : "—"}
                  </div>
                  <div className="font-medium mt-1">Order ID: {order.id}</div>
                  <div className="text-sm mt-1">
                    Status: <span className="font-medium">{order.status ?? "pending"}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-500">Items</div>
                  <div className="font-semibold">₹{Number(order.total ?? 0).toFixed(2)}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {order.items?.length ?? 0} {order.items?.length === 1 ? "item" : "items"}
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setExpanded((id) => (id === order.id ? null : order.id))}>
                    {expanded === order.id ? "Hide details" : "View details"}
                  </Button>
                </div>
              </div>

              {expanded === order.id && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  <div className="space-y-2">
                    {order.items?.map((it) => (
                      <div key={it.id} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img src={it.image ?? "/placeholder.png"} alt={it.name} className="w-12 h-12 object-cover rounded" />
                          <div>
                            <div className="font-medium">{it.name}</div>
                            <div className="text-xs text-gray-500">Qty: {it.qty}</div>
                          </div>
                        </div>
                        <div className="font-medium">₹{(it.price * it.qty).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t">
                    <div className="text-sm">Shipping</div>
                    <div className="text-sm">
                      {order.shipping ? (
                        <>
                          <div>{order.shipping.name}</div>
                          <div>{order.shipping.phone}</div>
                          <div>{order.shipping.address}</div>
                        </>
                      ) : (
                        <div className="text-gray-500">No shipping info</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
