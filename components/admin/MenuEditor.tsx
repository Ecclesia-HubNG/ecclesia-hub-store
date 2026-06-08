'use client'

import { useState, useTransition } from 'react'
import { saveMegaMenuConfig, saveFooterConfig } from '@/lib/actions/menus'
import type { MegaMenuConfig, MegaMenuColumn, FooterConfig, FooterColumn, MenuLink } from '@/lib/actions/menus'

type Tab = 'mega' | 'footer'

// ── Reusable link row ──────────────────────────────────────────────────────────
function LinkRow({
  link, index, total,
  onChange, onRemove, onMove,
}: {
  link: MenuLink; index: number; total: number
  onChange: (l: MenuLink) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  return (
    <div className="flex items-center gap-2 group">
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 disabled:opacity-20 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
          </svg>
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 disabled:opacity-20 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>
      <input
        type="text"
        value={link.label}
        onChange={e => onChange({ ...link, label: e.target.value })}
        placeholder="Label"
        className="w-32 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
      <input
        type="text"
        value={link.href}
        onChange={e => onChange({ ...link, href: e.target.value })}
        placeholder="/path or https://..."
        className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 font-mono focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
      <button
        type="button"
        onClick={onRemove}
        className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-red-400 transition-colors shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function moveItem<T>(arr: T[], from: number, dir: -1 | 1): T[] {
  const to = from + dir
  if (to < 0 || to >= arr.length) return arr
  const next = [...arr]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}

// ── Mega menu column card ──────────────────────────────────────────────────────
function MegaColumnCard({
  column, colIndex, total,
  onChange, onRemove,
}: {
  column: MegaMenuColumn; colIndex: number; total: number
  onChange: (c: MegaMenuColumn) => void
  onRemove: () => void
}) {
  const updateLink = (i: number, l: MenuLink) =>
    onChange({ ...column, links: column.links.map((x, idx) => idx === i ? l : x) })
  const removeLink = (i: number) =>
    onChange({ ...column, links: column.links.filter((_, idx) => idx !== i) })
  const moveLink = (i: number, dir: -1 | 1) =>
    onChange({ ...column, links: moveItem(column.links, i, dir) })
  const addLink = () =>
    onChange({ ...column, links: [...column.links, { label: '', href: '' }] })

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
        <input
          type="text"
          value={column.heading}
          onChange={e => onChange({ ...column, heading: e.target.value })}
          placeholder="Column heading"
          className="flex-1 text-sm font-semibold bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded"
          >
            Remove column
          </button>
        )}
      </div>

      <div className="p-4 space-y-2">
        {column.links.map((link, i) => (
          <LinkRow
            key={i}
            link={link}
            index={i}
            total={column.links.length}
            onChange={l => updateLink(i, l)}
            onRemove={() => removeLink(i)}
            onMove={dir => moveLink(i, dir)}
          />
        ))}
        <button
          type="button"
          onClick={addLink}
          className="flex items-center gap-1.5 mt-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add link
        </button>
      </div>
    </div>
  )
}

// ── Footer column card ─────────────────────────────────────────────────────────
function FooterColumnCard({
  column, colIndex, total,
  onChange, onRemove,
}: {
  column: FooterColumn; colIndex: number; total: number
  onChange: (c: FooterColumn) => void
  onRemove: () => void
}) {
  const updateLink = (i: number, l: MenuLink) =>
    onChange({ ...column, links: column.links.map((x, idx) => idx === i ? l : x) })
  const removeLink = (i: number) =>
    onChange({ ...column, links: column.links.filter((_, idx) => idx !== i) })
  const moveLink = (i: number, dir: -1 | 1) =>
    onChange({ ...column, links: moveItem(column.links, i, dir) })
  const addLink = () =>
    onChange({ ...column, links: [...column.links, { label: '', href: '' }] })

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
        <input
          type="text"
          value={column.title}
          onChange={e => onChange({ ...column, title: e.target.value })}
          placeholder="Column title"
          className="flex-1 text-sm font-semibold bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded"
          >
            Remove
          </button>
        )}
      </div>
      <div className="p-4 space-y-2">
        {column.links.map((link, i) => (
          <LinkRow
            key={i}
            link={link}
            index={i}
            total={column.links.length}
            onChange={l => updateLink(i, l)}
            onRemove={() => removeLink(i)}
            onMove={dir => moveLink(i, dir)}
          />
        ))}
        <button
          type="button"
          onClick={addLink}
          className="flex items-center gap-1.5 mt-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add link
        </button>
      </div>
    </div>
  )
}

// ── Main editor ────────────────────────────────────────────────────────────────
export default function MenuEditor({
  initialMegaMenu,
  initialFooter,
}: {
  initialMegaMenu: MegaMenuConfig
  initialFooter: FooterConfig
}) {
  const [tab, setTab] = useState<Tab>('mega')
  const [megaMenu, setMegaMenu] = useState<MegaMenuConfig>(initialMegaMenu)
  const [footer, setFooter] = useState<FooterConfig>(initialFooter)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

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

  // Mega menu column helpers
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

  // Footer column helpers
  const updateFooterColumn = (i: number, col: FooterColumn) =>
    setFooter(f => ({ ...f, columns: f.columns.map((c, idx) => idx === i ? col : c) }))
  const removeFooterColumn = (i: number) =>
    setFooter(f => ({ ...f, columns: f.columns.filter((_, idx) => idx !== i) }))
  const addFooterColumn = () =>
    setFooter(f => ({ ...f, columns: [...f.columns, { title: 'New Column', links: [] }] }))

  return (
    <div>
      {/* Tab bar + Save */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['mega', 'footer'] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
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
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
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
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Shop Columns</h3>
                <p className="text-xs text-gray-400 mt-0.5">These appear in the "Shop" dropdown mega menu.</p>
              </div>
              {megaMenu.columns.length < 4 && (
                <button
                  type="button"
                  onClick={addMegaColumn}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                <MegaColumnCard
                  key={i}
                  column={col}
                  colIndex={i}
                  total={megaMenu.columns.length}
                  onChange={c => updateMegaColumn(i, c)}
                  onRemove={() => removeMegaColumn(i)}
                />
              ))}
            </div>
          </div>

          {/* Plain nav */}
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Plain Navigation</h3>
              <p className="text-xs text-gray-400 mt-0.5">Top-level nav links shown beside the "Shop" button.</p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 p-4 space-y-2 max-w-xl">
              {megaMenu.plainNav.map((link, i) => (
                <LinkRow
                  key={i}
                  link={link}
                  index={i}
                  total={megaMenu.plainNav.length}
                  onChange={l => updatePlainNav(i, l)}
                  onRemove={() => removePlainNav(i)}
                  onMove={dir => movePlainNav(i, dir)}
                />
              ))}
              <button
                type="button"
                onClick={addPlainNav}
                className="flex items-center gap-1.5 mt-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer Menu Tab ── */}
      {tab === 'footer' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Footer Columns</h3>
              <p className="text-xs text-gray-400 mt-0.5">Link columns shown in the store footer.</p>
            </div>
            {footer.columns.length < 6 && (
              <button
                type="button"
                onClick={addFooterColumn}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
              <FooterColumnCard
                key={i}
                column={col}
                colIndex={i}
                total={footer.columns.length}
                onChange={c => updateFooterColumn(i, c)}
                onRemove={() => removeFooterColumn(i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
