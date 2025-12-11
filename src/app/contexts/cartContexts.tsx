// contexts/CartContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

export type CartItem = {
  id: string;
  name?: string;
  price: number;
  qty: number;
  image?: string;
};

type CartCtx = {
  cart: CartItem[];
  addItem: (item: CartItem, qty?: number) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartCtx | undefined>(undefined);
const LOCAL_KEY = "cart_simple_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  // save localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("save cart", e);
    }
  }, [cart]);

  // helper: load server cart (single row by user_id)
  async function loadServerCart(userId: string) {
    try {
      const { data, error } = await supabase
        .from("carts")
        .select("items")
        .eq("user_id", userId)
        .single();
      if (error) {
        // no row -> return null
        return null;
      }
      return data?.items ?? [];
    } catch (e) {
      console.error("loadServerCart", e);
      return null;
    }
  }

  // helper: save server cart (upsert on user_id)
  async function saveServerCart(userId: string, items: CartItem[]) {
    try {
      const {error} =await supabase
        .from("carts")
        .upsert({ user_id: userId, items }, { onConflict: "user_id" });
        console.log(error)
    } catch (e) {
      console.error("saveServerCart", e);
    }
  }

  // on auth change or initial mount: if logged in, merge and sync
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user ?? null;
        if (!user || !mounted) return;

        const serverItems = (await loadServerCart(user.id)) ?? [];

        // SIMPLE MERGE:
        // keep local items; if server has items not in local, append them.
        const map = new Map<string, CartItem>();
        cart.forEach((it) => map.set(it.id, { ...it }));
        serverItems.forEach((it: CartItem) => {
          if (!map.has(it.id)) map.set(it.id, it);
        });
        const merged = Array.from(map.values());

        // update local and save to server
        setCart(merged);
        await saveServerCart(user.id, merged);
      } catch (e) {
        // ignore
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const user = session?.user ?? null;
      if (!user) return;
      const serverItems = (await loadServerCart(user.id)) ?? [];
      const map = new Map<string, CartItem>();
      cart.forEach((it) => map.set(it.id, { ...it }));
      serverItems.forEach((it: CartItem) => {
        if (!map.has(it.id)) map.set(it.id, it);
      });
      const merged = Array.from(map.values());
      setCart(merged);
      await saveServerCart(user.id, merged);
    });

    return () => {
      mounted = false;
      try {
        listener?.subscription?.unsubscribe();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // whenever cart changes and user logged-in, save immediately (simple)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user ?? null;
        if (!user) return;
        await saveServerCart(user.id, cart);
      } catch (e) {
        // ignore
      }
    })();
  }, [cart]);

  // operations
  const addItem = (item: CartItem, qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx === -1) return [...prev, { ...item, qty }];
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + qty };
      return next;
    });
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((p) => p.id !== id));
  const setQty = (id: string, qty: number) => setCart((prev) => prev.map((p) => (p.id === id ? { ...p, qty: Math.max(1, qty) } : p)));
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem, setQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
