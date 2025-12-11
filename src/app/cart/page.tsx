// app/cart/page.tsx
"use client";

import { useCart } from "../contexts/cartContexts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { cart, setQty, removeItem, clearCart, total } = useCart();
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold mb-6">Cart</h1>

      {cart.length === 0 ? (
        <p className="text-center text-gray-600">Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-4">
            {cart.map((it) => (
              <div
                key={it.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded"
              >
                <img
                  src={it.image ?? "/placeholder.png"}
                  alt={it.name}
                  className="w-full sm:w-24 h-40 sm:h-24 object-cover rounded"
                />

                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-gray-500">₹{it.price.toFixed(2)}</div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <Button
                        size="sm"
                        onClick={() => setQty(it.id, Math.max(1, it.qty - 1))}
                      >
                        −
                      </Button>

                      <Input
                        value={String(it.qty)}
                        onChange={(e: any) =>
                          setQty(it.id, Math.max(1, Number(e.target.value) || 1))
                        }
                        className="w-16 text-center"
                        aria-label={`Quantity for ${it.name}`}
                      />

                      <Button size="sm" onClick={() => setQty(it.id, it.qty + 1)}>
                        +
                      </Button>

                      <Button variant="ghost" size="sm" onClick={() => removeItem(it.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer: responsive layout */}
          <div className="mt-6 grid gap-3 sm:gap-0 sm:grid-cols-3 items-center">
            {/* Clear cart button (left on desktop, top on mobile) */}
            <div className="col-span-1">
              <Button variant="destructive" onClick={clearCart} className="w-full sm:w-auto">
                Clear Cart
              </Button>
            </div>

            {/* Total (center on desktop, middle on mobile) */}
            <div className="col-span-1 flex flex-col items-center">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-2xl font-semibold">₹{total.toFixed(2)}</div>
            </div>

            {/* Checkout (right on desktop, bottom on mobile) */}
            <div className="col-span-1 flex justify-end">
              <Button
                className="w-full sm:w-auto"
                onClick={() => router.push("/checkout")}
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
