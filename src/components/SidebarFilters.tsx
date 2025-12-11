"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function SidebarFilters() {
  const router = useRouter();
  const params = useSearchParams();

  // initialize state from URL params (fallback defaults)
  const [min, setMin] = useState(() => params.get("min") ?? "0");
  const [max, setMax] = useState(() => params.get("max") ?? "1000");
  const [category, setCategory] = useState(() => params.get("category") ?? "");

  // keep state in sync when URL params change (e.g. back/forward navigation)
  useEffect(() => {
    const pMin = params.get("min") ?? "0";
    const pMax = params.get("max") ?? "1000";
    const pCategory = params.get("category") ?? "";

    // only update if different (prevents flicker)
    if (pMin !== min) setMin(pMin);
    if (pMax !== max) setMax(pMax);
    if (pCategory !== category) setCategory(pCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  function applyFilters() {
    const q = new URLSearchParams();

    // sanitize inputs (trim) and only set if meaningful
    const minVal = (min ?? "").trim();
    const maxVal = (max ?? "").trim();

    if (minVal !== "") q.set("min", minVal);
    if (maxVal !== "") q.set("max", maxVal);
    if (category) q.set("category", category);

    router.push("/products?" + q.toString());
  }

  return (
    <div className="w-64 p-4 border-r space-y-4">
      <Input
        placeholder="Min Price"
        value={min}
        onChange={(e: any) => setMin(e.target.value)}
      />
      <Input
        placeholder="Max Price"
        value={max}
        onChange={(e: any) => setMax(e.target.value)}
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border p-2 w-full"
      >
        <option value="">All</option>
        <option value="electronics">Electronics</option>
        <option value="clothes">Clothes</option>
        <option value="home">Home</option>
        <option value="books">Books</option>
        <option value="shoes">Shoes</option>
      </select>

      <Button onClick={applyFilters}>Apply</Button>
    </div>
  );
}
