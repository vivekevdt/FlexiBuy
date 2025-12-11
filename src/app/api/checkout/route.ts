import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { user_id } = await request.json();

  const { data: cart } = await supabase.from("carts").select("*").eq("user_id", user_id).single();

  const total = cart.items.reduce((t: any, i: any) => t + i.price * i.qty, 0);

  await supabase.from("orders").insert({
    user_id,
    items: cart.items,
    total
  });

  await supabase.from("carts").delete().eq("user_id", user_id);

  return NextResponse.json({ ok: true });
}
