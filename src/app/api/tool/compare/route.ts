// app/api/tool/compare/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

type Product = {
  id?: number;
  name?: string;
  price?: number;
  battery_hours?: number;
  ram_gb?: number;
  storage_gb?: number;
  rating?: number;
  description?: string;
  [k: string]: any;
};

type CompareResponse = {
  ok: boolean;
  a?: Product | null;
  b?: Product | null;
  comparison?: { diffs: string[]; recommendation: string };
  error?: string;
};

function computeComparison(a: Product, b: Product) {
  const diffs: string[] = [];
  if (a.price !== b.price) diffs.push(`Price: ${a.name} $${a.price} vs ${b.name} $${b.price}`);
  if (a.battery_hours !== b.battery_hours) diffs.push(`Battery (hours): ${a.battery_hours} vs ${b.battery_hours}`);
  if (a.ram_gb !== b.ram_gb) diffs.push(`RAM (GB): ${a.ram_gb} vs ${b.ram_gb}`);
  if (a.storage_gb !== b.storage_gb) diffs.push(`Storage (GB): ${a.storage_gb} vs ${b.storage_gb}`);
  if (a.rating !== b.rating) diffs.push(`Rating: ${a.rating} vs ${b.rating}`);

  const score = (p: Product) =>
    (Number(p.rating || 0) * 2) + ((Number(p.battery_hours || 0)) / 10) + ((Number(p.ram_gb || 0)) / 2) - ((Number(p.price || 0)) / 200);

  const recommendation = score(a) > score(b) ? (a.name || 'Product A') : (b.name || 'Product B');

  return { diffs, recommendation };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { aId, bId, aName, bName } = body || {};

    if (!req) return NextResponse.json({ ok: false, error: 'Invalid request' } as CompareResponse, { status: 400 });

    let a: Product | null = null;
    let b: Product | null = null;

    if (aId && bId) {
      const { data: da, error: ea } = await supabase
        .from('chatbotproducts')
        .select('*')
        .eq('id', aId)
        .limit(1)
        .maybeSingle(); // maybeSingle returns null if not found

      const { data: db, error: eb } = await supabase
        .from('chatbotproducts')
        .select('*')
        .eq('id', bId)
        .limit(1)
        .maybeSingle();

      if (ea) {
        console.error('supabase error (aId)', ea);
        return NextResponse.json({ ok: false, error: ea.message || String(ea) } as CompareResponse, { status: 500 });
      }
      if (eb) {
        console.error('supabase error (bId)', eb);
        return NextResponse.json({ ok: false, error: eb.message || String(eb) } as CompareResponse, { status: 500 });
      }

      a = da || null;
      b = db || null;
    } else {
      if (!aName || !bName) {
        return NextResponse.json({ ok: false, error: 'Provide either aId & bId or aName & bName' } as CompareResponse, { status: 400 });
      }

      const { data: da, error: ea } = await supabase
        .from('chatbotproducts')
        .select('*')
        .ilike('name', aName)
        .limit(1)
        .maybeSingle();

      const { data: db, error: eb } = await supabase
        .from('chatbotproducts')
        .select('*')
        .ilike('name', bName)
        .limit(1)
        .maybeSingle();


      if (ea) {
        console.error('supabase error (aName)', ea);
        return NextResponse.json({ ok: false, error: ea.message || String(ea) } as CompareResponse, { status: 500 });
      }
      if (eb) {
        console.error('supabase error (bName)', eb);
        return NextResponse.json({ ok: false, error: eb.message || String(eb) } as CompareResponse, { status: 500 });
      }

      a = da || null;
      b = db || null;
    }

    if (!a || !b) {
      return NextResponse.json({ ok: false, error: 'Products not found' } as CompareResponse, { status: 404 });
    }

    const comparison = computeComparison(a, b);
    return NextResponse.json({ ok: true, a, b, comparison } as CompareResponse);
  } catch (e: any) {
    console.error('compare route error', e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) } as CompareResponse, { status: 500 });
  }
}
