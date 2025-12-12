'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Props = {
  page: number;
  totalPages: number;
};

export default function Pagination({ page, totalPages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildParams(newPage: number) {
    const params = new URLSearchParams();

    // preserve existing filter params if present
    const min = searchParams.get('min');
    const max = searchParams.get('max');
    const category = searchParams.get('category');

    if (min !== null) params.set('min', min);
    if (max !== null) params.set('max', max);
    if (category !== null) params.set('category', category);

    params.set('page', String(newPage));
    return params.toString();
  }

  function goTo(newPage: number) {
    // guard

    if (newPage < 1 || newPage > totalPages) return;
    const qs = buildParams(newPage);
    router.push(`${pathname}?${qs}`);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
      >
        Prev
      </button>

      {/* small page buttons, adjust as needed */}
      <span className="px-3 py-1">{page} / {totalPages}</span>

      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
