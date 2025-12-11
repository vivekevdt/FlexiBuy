"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/app/contexts/cartContexts";

export default function ProductCard({ product }: any) {
  const { addItem } = useCart();

  function handleAdd() {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        qty: 1,
      },
      1
    );
  }

  return (
    // make card full height and a flex column so we can push footer to bottom
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Image: fixed height, object-cover */}
      <div className="w-full h-44 sm:h-40 md:h-44 bg-gray-100 overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Content: flex column and grow so footer sits at bottom */}
      <CardContent className="p-3 flex flex-col flex-1">
        {/* Top: title + category */}
        <div>
          <h3 className="font-medium text-lg leading-snug mb-1 line-clamp-2">{product.name}</h3>
          {product.category && (
            <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {product.category}
            </span>
          )}
        </div>

        {/* Spacer / middle content can go here if needed */}
        <div className="mt-3 text-base font-bold text-black">₹{Number(product.price).toFixed(2)}</div>

        {/* Footer: push to bottom */}
        <div className="mt-auto">
          <Button onClick={handleAdd} className="w-full mt-3">
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
