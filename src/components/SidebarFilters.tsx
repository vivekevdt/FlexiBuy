"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";

export default function SidebarFilters() {
  const router = useRouter();
  const params = useSearchParams();

  // default price range
  const DEFAULT_MIN = 0;
  const DEFAULT_MAX = 1000;

  // initialize values from params
  const [range, setRange] = useState([
    Number(params.get("min") ?? DEFAULT_MIN),
    Number(params.get("max") ?? DEFAULT_MAX),
  ]);

  const [category, setCategory] = useState(
    params.get("category") ?? ""
  );

  // keep sync when URL changes (back/forward)
  useEffect(() => {
    const newMin = Number(params.get("min") ?? DEFAULT_MIN);
    const newMax = Number(params.get("max") ?? DEFAULT_MAX);
    const newCategory = params.get("category") ?? "";

    if (newMin !== range[0] || newMax !== range[1])
      setRange([newMin, newMax]);

    if (newCategory !== category) setCategory(newCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  function applyFilters() {
    const q = new URLSearchParams();

    q.set("min", String(range[0]));
    q.set("max", String(range[1]));
    if (category) q.set("category", category);

    router.push("/products?" + q.toString());
  }

  return (
    <div className="w-64 p-4 border-r space-y-6">
      {/* Price Slider */}
      <div>
        <p className="font-medium mb-2">Price Range</p>

        <Slider
          value={range}
          min={0}
          max={1000}   // <-- MAX PRICE FIXED HERE
          step={10}
          onValueChange={(val) => setRange(val)}
        />

        <div className="flex justify-between text-sm mt-2">
          <span>₹{range[0]}</span>
          <span>₹{range[1]}</span>
        </div>
      </div>

      {/* Category Select */}
      <div>
        <p className="font-medium mb-2">Category</p>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 w-full rounded"
        >
          <option value="">All</option>
          <option value="electronics">Electronics</option>
          <option value="clothes">Clothes</option>
          <option value="home">Home</option>
          <option value="books">Books</option>
          <option value="shoes">Shoes</option>
        </select>
      </div>

      <Button onClick={applyFilters} className="w-full">
        Apply Filters
      </Button>
    </div>
  );
}
