import supabase from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCart";
import SidebarFilters from "@/components/SidebarFilters";
import Link from "next/link";
import Pagination from "@/components/Pagination";

export default async function Page({ searchParams  }: any) {
    const rawParams = (searchParams && typeof searchParams.then === "function")
    ? await searchParams
    : searchParams ?? {};

  const min = Number(rawParams.min ?? 0);
  const max = Number(rawParams.max ?? 999999);
  const category = rawParams.category ?? null;

  // 🔹 Pagination params
  const page = Number(rawParams.page ?? 1);
  const limit = 12; // products per page
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // 🔹 Build query with filters
  let query = supabase
    .from("products")
    .select("*", { count: "exact" }) // ❗ needed for total products count
    .gte("price", min)
    .lte("price", max);

  if (category) query = query.eq("category", category);

  const { data, count } = await query.range(from, to);

  const totalPages = Math.ceil((count ?? 0) / limit);

  // Keep filters in pagination links
  const createQuery = (pageNumber: number) => {
    const params = new URLSearchParams({
      page: String(pageNumber),
      min: String(min),
      max: String(max),
    });

    if (category) params.set("category", category);
    console.log(pageNumber);

    return `/products?${params.toString()}`;
  };



  return (
<div className="min-h-[60vh]">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    {/* Mobile: collapsible filters */}
    <div className="md:hidden mb-4">
      <details className="border rounded">
        <summary className="px-4 py-3 cursor-pointer select-none font-medium">
          Filters
        </summary>
        <div className="p-4">
          <SidebarFilters />
        </div>
      </details>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:block">
        <div className="sticky top-20">
          <SidebarFilters />
        </div>
      </aside>

      {/* Main content */}
      <main>
        {/* Product grid - responsive columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data?.length ? (
            data.map((p: any) => <ProductCard key={p.id} product={p} />)
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500">
              No products found.
            </div>
          )}
        </div>

        {/* Pagination centered */}
        <div className="mt-8 flex justify-center">
          <Pagination page={page} totalPages={totalPages} />
        </div>
      </main>
    </div>
  </div>
</div>

  );
}
