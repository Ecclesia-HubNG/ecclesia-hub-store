'use client'

import { useState, useTransition, useRef } from 'react'
import { saveMegaMenuConfig, saveFooterConfig } from '@/lib/actions/menus'
import type { MegaMenuConfig, MegaMenuColumn, FooterConfig, FooterColumn, MenuLink } from '@/lib/menu-types'

type Tab = 'mega' | 'footer'

const STORE_PAGES: { label: string; href: string; group?: string }[] = [
  { label: 'Shop (All Products)',  href: '/shop' },
  { label: 'Bestsellers',          href: '/bestsellers' },
  { label: 'New Arrivals',         href: '/new-arrivals' },
  { label: 'Gift Items',           href: '/gifts' },
  { label: 'Sale / Promotions',    href: '/promotions' },
  { label: 'Deals',                href: '/deals' },
  { label: 'Brands',               href: '/brands' },
  { label: 'About Us',             href: '/about' },
  { label: 'Contact',              href: '/about' },
  { label: 'Cart',                 href: '/cart' },
  { label: 'Wishlist',             href: '/wishlist' },
  { label: 'My Account',          href: '/account' },
  { label: 'Privacy Policy',       href: '/privacy' },
  { label: 'Terms of Service',     href: '/terms' },
]

function moveItem<T>(arr: T[], from: number, dir: -1 | 1): T[] {
  const to = from + dir
  if (to < 0 || to >= arr.length) return arr
  const next = [...arr]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}

// ── Input field ──────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, mono, className,
}: {
  label?: string; value: string; onChange: (v: string) => void
  placeholder?: string; mono?: boolean; className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      {label && (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-0.5">
          {label}
        </span>
      )}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-800 transition-colors ${mono ? 'font-mono text-xs' : ''}`}
      />
    </div>
  )
}

// ── Href autocomplete input ───────────────────────────────────────────────────
function HrefInput({
  value, onChange, extraPages,
}: {
  value: string; onChange: (v: string) => void
  extraPages: { label: string; href: string; group?: string }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const allPages = [...STORE_PAGES, ...extraPages]
  const q = value.toLowerCase()
  const suggestions = q.length === 0
    ? allPages
    : allPages.filter(p =>
        p.label.toLowerCase().includes(q) || p.href.toLowerCase().includes(q)
      )

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="/path"
        className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-900 transition-colors"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map(p => (
            <button
              key={p.href + p.label}
              type="button"
              onMouseDown={() => { onChange(p.href); setOpen(false) }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                {p.group && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 shrink-0 w-14 text-right">{p.group}</span>
                )}
                <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{p.label}</span>
              </div>
              <span className="text-gray-400 dark:text-gray-500 font-mono shrink-0">{p.href}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Link row ─────────────────────────────────────────────────────────────────
function LinkRow({
  link, index, total, onChange, onRemove, onMove, extraPages,
}: {
  link: MenuLink; index: number; total: number
  onChange: (l: MenuLink) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
  extraPages: { label: string; href: string; group?: string }[]
}) {
  return (
    <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700/60 rounded-xl group hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
      {/* Reorder handle */}
      <div className="flex flex-col gap-0.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          className="w-5 h-4 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-20 transition-colors"
        >
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
          </svg>
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          className="w-5 h-4 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-20 transition-colors"
        >
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Label */}
      <input
        type="text"
        value={link.label}
        onChange={e => onChange({ ...link, label: e.target.value })}
        placeholder="Label"
        className="w-28 shrink-0 px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:bg-white dark:focus:bg-gray-900 transition-colors"
      />

      {/* Divider */}
      <svg className="w-3 h-3 shrink-0 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
      </svg>

      {/* Href with autocomplete */}
      <HrefInput value={link.href} onChange={v => onChange({ ...link, href: v })} extraPages={extraPages} />

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 dark:text-gray-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ── Column card ───────────────────────────────────────────────────────────────
function ColumnCard({
  heading, links, total,
  onHeadingChange, onLinkChange, onLinkRemove, onLinkMove, onAddLink, onRemove,
  headingPlaceholder, extraPages,
}: {
  heading: string
  links: MenuLink[]
  total: number
  onHeadingChange: (v: string) => void
  onLinkChange: (i: number, l: MenuLink) => void
  onLinkRemove: (i: number) => void
  onLinkMove: (i: number, dir: -1 | 1) => void
  onAddLink: () => void
  onRemove: () => void
  headingPlaceholder?: string
  extraPages: { label: string; href: string; group?: string }[]
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-800/40">
        <div className="w-1.5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 shrink-0" />
        <input
          type="text"
          value={heading}
          onChange={e => onHeadingChange(e.target.value)}
          placeholder={headingPlaceholder ?? 'Column heading'}
          className="flex-1 text-sm font-semibold bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-300 focus:outline-none"
        />
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors px-2 py-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Remove
          </button>
        )}
      </div>

      {/* Links */}
      <div className="p-3 space-y-1.5">
        {links.length === 0 && (
          <p className="text-xs text-gray-300 dark:text-gray-600 text-center py-3">No links yet</p>
        )}
        {links.map((link, i) => (
          <LinkRow
            key={i}
            link={link}
            index={i}
            total={links.length}
            onChange={l => onLinkChange(i, l)}
            onRemove={() => onLinkRemove(i)}
            onMove={dir => onLinkMove(i, dir)}
            extraPages={extraPages}
          />
        ))}

        {/* Add link */}
        <button
          type="button"
          onClick={onAddLink}
          className="w-full flex items-center justify-center gap-1.5 mt-1 py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add link
        </button>
      </div>
    </div>
  )
}

type PageOption = { label: string; href: string; group?: string }

// ── Main editor ───────────────────────────────────────────────────────────────
export default function MenuEditor({
  initialMegaMenu,
  initialFooter,
  categories = [],
  brands = [],
}: {
  initialMegaMenu: MegaMenuConfig
  initialFooter: FooterConfig
  categories?: PageOption[]
  brands?: PageOption[]
}) {
  const [tab, setTab] = useState<Tab>('mega')
  const [megaMenu, setMegaMenu] = useState<MegaMenuConfig>(initialMegaMenu)
  const [footer, setFooter] = useState<FooterConfig>(initialFooter)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const extraPages: PageOption[] = [
    ...categories.map(c => ({ ...c, group: 'Category' })),
    ...brands.map(b => ({ ...b, group: 'Brand' })),
  ]

  const save = () => {
    setSaveError('')
    startTransition(async () => {
      const result = tab === 'mega'
        ? await saveMegaMenuConfig(megaMenu)
        : await saveFooterConfig(footer)
      if ('error' in result && result.error) {
        setSaveError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    })
  }

  // Mega menu helpers
  const updateMegaColumn = (i: number, col: MegaMenuColumn) =>
    setMegaMenu(m => ({ ...m, columns: m.columns.map((c, idx) => idx === i ? col : c) }))
  const removeMegaColumn = (i: number) =>
    setMegaMenu(m => ({ ...m, columns: m.columns.filter((_, idx) => idx !== i) }))
  const addMegaColumn = () =>
    setMegaMenu(m => ({ ...m, columns: [...m.columns, { heading: 'New Column', links: [] }] }))

  const updatePlainNav = (i: number, l: MenuLink) =>
    setMegaMenu(m => ({ ...m, plainNav: m.plainNav.map((x, idx) => idx === i ? l : x) }))
  const removePlainNav = (i: number) =>
    setMegaMenu(m => ({ ...m, plainNav: m.plainNav.filter((_, idx) => idx !== i) }))
  const movePlainNav = (i: number, dir: -1 | 1) =>
    setMegaMenu(m => ({ ...m, plainNav: moveItem(m.plainNav, i, dir) }))
  const addPlainNav = () =>
    setMegaMenu(m => ({ ...m, plainNav: [...m.plainNav, { label: '', href: '' }] }))

  // Footer helpers
  const updateFooterColumn = (i: number, col: FooterColumn) =>
    setFooter(f => ({ ...f, columns: f.columns.map((c, idx) => idx === i ? col : c) }))
  const removeFooterColumn = (i: number) =>
    setFooter(f => ({ ...f, columns: f.columns.filter((_, idx) => idx !== i) }))
  const addFooterColumn = () =>
    setFooter(f => ({ ...f, columns: [...f.columns, { title: 'New Column', links: [] }] }))

  return (
    <div>
      {/* Tab bar + Save */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {(['mega', 'footer'] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-5 py-1.5 text-sm font-medium rounded-lg transition-all ${
                tab === t
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t === 'mega' ? 'Mega Menu' : 'Footer Menu'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {saveError && <p className="text-xs text-red-500">{saveError}</p>}
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isPending ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : saved ? (
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
            {isPending ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* ── Mega Menu Tab ── */}
      {tab === 'mega' && (
        <div className="space-y-8">
          {/* Columns */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Shop Columns</h3>
                <p className="text-xs text-gray-400 mt-0.5">Appear in the "Shop" dropdown mega menu.</p>
              </div>
              {megaMenu.columns.length < 4 && (
                <button
                  type="button"
                  onClick={addMegaColumn}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add column
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {megaMenu.columns.map((col, i) => (
                <ColumnCard
                  key={i}
                  heading={col.heading}
                  links={col.links}
                  total={megaMenu.columns.length}
                  onHeadingChange={v => updateMegaColumn(i, { ...col, heading: v })}
                  onLinkChange={(li, l) => updateMegaColumn(i, { ...col, links: col.links.map((x, idx) => idx === li ? l : x) })}
                  onLinkRemove={li => updateMegaColumn(i, { ...col, links: col.links.filter((_, idx) => idx !== li) })}
                  onLinkMove={(li, dir) => updateMegaColumn(i, { ...col, links: moveItem(col.links, li, dir) })}
                  onAddLink={() => updateMegaColumn(i, { ...col, links: [...col.links, { label: '', href: '' }] })}
                  onRemove={() => removeMegaColumn(i)}
                  extraPages={extraPages}
                />
              ))}
            </div>
          </section>

          {/* Plain nav */}
          <section>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Plain Navigation</h3>
              <p className="text-xs text-gray-400 mt-0.5">Top-level nav links shown beside the "Shop" button.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm max-w-xl">
              <div className="p-3 space-y-1.5">
                {megaMenu.plainNav.length === 0 && (
                  <p className="text-xs text-gray-300 dark:text-gray-600 text-center py-3">No links yet</p>
                )}
                {megaMenu.plainNav.map((link, i) => (
                  <LinkRow
                    key={i}
                    link={link}
                    index={i}
                    total={megaMenu.plainNav.length}
                    onChange={l => updatePlainNav(i, l)}
                    onRemove={() => removePlainNav(i)}
                    onMove={dir => movePlainNav(i, dir)}
                    extraPages={extraPages}
                  />
                ))}
                <button
                  type="button"
                  onClick={addPlainNav}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add link
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── Footer Menu Tab ── */}
      {tab === 'footer' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Footer Columns</h3>
              <p className="text-xs text-gray-400 mt-0.5">Link columns shown in the store footer.</p>
            </div>
            {footer.columns.length < 6 && (
              <button
                type="button"
                onClick={addFooterColumn}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add column
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {footer.columns.map((col, i) => (
              <ColumnCard
                key={i}
                heading={col.title}
                links={col.links}
                total={footer.columns.length}
                headingPlaceholder="Column title"
                onHeadingChange={v => updateFooterColumn(i, { ...col, title: v })}
                onLinkChange={(li, l) => updateFooterColumn(i, { ...col, links: col.links.map((x, idx) => idx === li ? l : x) })}
                onLinkRemove={li => updateFooterColumn(i, { ...col, links: col.links.filter((_, idx) => idx !== li) })}
                onLinkMove={(li, dir) => updateFooterColumn(i, { ...col, links: moveItem(col.links, li, dir) })}
                onAddLink={() => updateFooterColumn(i, { ...col, links: [...col.links, { label: '', href: '' }] })}
                onRemove={() => removeFooterColumn(i)}
                extraPages={extraPages}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
