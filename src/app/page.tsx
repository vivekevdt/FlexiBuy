// app/page.tsx (server)
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ChatBox from "@/components/ChatBox";

export default function HomePage() {
  const categories = ["electronics", "clothes", "home", "books", "shoes"];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <section className="text-center py-20 bg-white shadow rounded">
        <h1 className="text-4xl font-bold mb-4">Welcome to MyStore</h1>
        <p className="text-gray-600 mb-6">Find the best products at the best prices.</p>
        <Link href="/products">
          <Button size="lg">Browse Products</Button>
        </Link>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Popular Categories</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Link href={`/products?category=${cat}`} key={cat}>
              <Badge variant="secondary" className="cursor-pointer px-4 py-2 text-sm">
                {cat}
              </Badge>
            </Link>
          ))}
        </div>
      </section>
      <ChatBox/>
    </div>
  );
}
