'use client'

import Link from 'next/link'

interface Props {
  currentPage: number
  totalCount: number
  pageSize: number
  /** Base query string without `page=`, e.g. "?q=foo&role=repairer" */
  baseQuery: string
}

function pageHref(base: string, page: number) {
  const params = new URLSearchParams(base.replace(/^\?/, ''))
  params.set('page', String(page))
  return `?${params.toString()}`
}

export default function AdminPagination({ currentPage, totalCount, pageSize, baseQuery }: Props) {
  const totalPages = Math.ceil(totalCount / pageSize)
  if (totalPages <= 1) return null

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-300)' }}>
        {totalCount} total · Page {currentPage} of {totalPages}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        {currentPage > 1 && (
          <Link href={pageHref(baseQuery, currentPage - 1)} className="btn btn--ghost btn--sm">← Prev</Link>
        )}
        {currentPage < totalPages && (
          <Link href={pageHref(baseQuery, currentPage + 1)} className="btn btn--ghost btn--sm">Next →</Link>
        )}
      </div>
    </div>
  )
}
