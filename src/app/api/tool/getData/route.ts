// app/api/tool/getData/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type ErrorResponse = { ok: false; error: string };
type Product = any; // narrow this if you have a Product type/interface
type SuccessProductResponse = { ok: true; product: Product | null };
type SuccessListResponse = { ok: true; results: Product[] };

export async function POST(req: Request) {
  // Helper: clean the incoming query by stripping many common filler words/phrases
  function cleanProductPhrase(raw?: string) {
    if (!raw) return "";
    let s = String(raw).toLowerCase().trim();

    // Comprehensive filler list (you asked to "add all fillers")
    const fillers = [
      "tell me about",
      "tell me the",
      "tell me",
      "give me",
      "show me",
      "show",
      "details of",
      "details",
      "specs of",
      "specs",
      "specifications of",
      "specification of",
      "price of",
      "price",
      "battery of",
      "battery",
      "ram of",
      "ram",
      "storage of",
      "storage",
      "rating of",
      "rating",
      "what is",
      "what's",
      "what are",
      "what are the",
      "what are the specs of",
      "information about",
      "about",
      "of",
      "the",
      "please",
      "can you",
      "could you",
      "i want",
      "i need",
      "i'd like",
      "give details about",
      "give me details about",
      "show details of",
      "tell details of",
      "details for",
      "info about",
      "information on",
      "details on",
      "which is",
      "which are",
      "compare",
      "compare with",
      "compare to",
      "vs",
      "vs.",
      "and",
      "or"
    ];

    const fillerRegex = new RegExp(
      "^(" +
        fillers.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") +
        ")\\s+",
      "i"
    );

    // Strip leading fillers repeatedly (handles repeated fillers like "about about ...")
    while (fillerRegex.test(s)) {
      s = s.replace(fillerRegex, "").trim();
    }

    // Remove surrounding punctuation, extra spaces, stray leading/trailing characters
    s = s.replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();

    return s;
  }

  // simple meaningful check
  function isMeaningful(q?: string) {
    if (!q) return false;
    const cleaned = q.replace(/\s+/g, "").trim();
    return cleaned.length >= 2;
  }

  try {
    const body = await req.json();
    const query: string | undefined = body?.query;
    const id: number | string | undefined = body?.id;

    if (!req) {
      return NextResponse.json({ ok: false, error: "Invalid request" } as ErrorResponse, {
        status: 400,
      });
    }

    // If id provided -> return single product
    if (id) {
      const { data, error } = await supabase
        .from("chatbotproducts")
        .select("*")
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("getData (by id) error", error);
        return NextResponse.json({ ok: false, error: error.message || String(error) } as ErrorResponse, {
          status: 500,
        });
      }

      return NextResponse.json({ ok: true, product: data } as SuccessProductResponse);
    }

    if (!query) {
      return NextResponse.json({ ok: false, error: "Provide query or id" } as ErrorResponse, {
        status: 400,
      });
    }

    // Clean the incoming query to remove fillers
    const cleanedQuery = cleanProductPhrase(query);

    if (!isMeaningful(cleanedQuery)) {
      return NextResponse.json({ ok: true, results: [] } as SuccessListResponse);
    }

    // 1) Try quick single match using ilike('%cleaned%')
    try {
      const { data: exact, error: errExact } = await supabase
        .from("chatbotproducts")
        .select("*")
        .ilike("name", `%${cleanedQuery}%`)
        .limit(1)
        .maybeSingle();

      if (!errExact && exact) {
        return NextResponse.json({ ok: true, product: exact } as SuccessProductResponse);
      }
    } catch (e: any) {
      console.warn("getData: exact match attempt failed", e?.message || e);
    }

    // 2) Token-AND search on name (require each token to appear)
    const tokens = cleanedQuery.split(" ").filter((t) => t.length > 1);
    if (tokens.length > 0) {
      try {
        let qb: any = supabase.from("chatbotproducts").select("*").limit(10);
        for (const tk of tokens) {
          qb = qb.ilike("name", `%${tk}%`);
        }
        const { data: andData, error: andErr } = await qb;
        if (!andErr && andData && andData.length > 0) {
          if (andData.length === 1) {
            return NextResponse.json({ ok: true, product: andData[0] } as SuccessProductResponse);
          }
          return NextResponse.json({ ok: true, results: andData } as SuccessListResponse);
        }
      } catch (e: any) {
        console.warn("getData: token-AND search failed", e?.message || e);
      }
    }

    // 3) Fallback: broader search across name OR description
    try {
      const { data, error } = await supabase
        .from("chatbotproducts")
        .select("*")
        .or(`name.ilike.%${cleanedQuery}%,description.ilike.%${cleanedQuery}%`)
        .limit(10);

      if (error) {
        console.error("getData (search) error", error);
        return NextResponse.json({ ok: false, error: error.message || String(error) } as ErrorResponse, {
          status: 500,
        });
      }

      return NextResponse.json({ ok: true, results: data } as SuccessListResponse);
    } catch (e: any) {
      console.error("getData fallback search error", e);
      return NextResponse.json({ ok: false, error: e?.message || String(e) } as ErrorResponse, {
        status: 500,
      });
    }
  } catch (e: any) {
    console.error("getData route error", e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) } as ErrorResponse, {
      status: 500,
    });
  }
}
