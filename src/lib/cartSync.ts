import localforage from "localforage";
import supabase from "@/lib/supabaseClient";

export async function syncCart(userId: string) {
  const local = (await localforage.getItem("cart")) || [];

  const { data } = await supabase.from("carts").select("*").eq("user_id", userId).single();
  let server = data?.items || [];

  const map = new Map();

  [...local, ...server].forEach((item: any) => {
    if (!map.has(item.id)) map.set(item.id, { ...item });
    else map.get(item.id).qty += item.qty;
  });

  const merged = Array.from(map.values());

  if (!data)
    await supabase.from("carts").insert({ user_id: userId, items: merged });
  else
    await supabase.from("carts").update({ items: merged }).eq("user_id", userId);

  await localforage.removeItem("cart");
}
