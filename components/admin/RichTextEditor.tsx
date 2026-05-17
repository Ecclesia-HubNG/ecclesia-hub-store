'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { useRef } from 'react'
import { uploadEmailAsset } from '@/lib/actions/upload'

// ── Toolbar ───────────────────────────────────────────────────────────────────
const COLORS = ['#111111', '#4A0F1C', '#1d4ed8', '#15803d', '#b45309', '#7c3aed', '#be123c', '#666666']

function Btn({
  active, disabled, onClick, title, children,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center w-7 h-7 rounded text-sm transition-colors ${
        active
          ? 'bg-[#4A0F1C] text-white'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
      } disabled:opacity-30`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />
}

function Toolbar({ editor, onImageUpload }: { editor: Editor; onImageUpload: () => void }) {
  function setLink() {
    const prev = editor.getAttributes('link').href
    const url = window.prompt('URL', prev)
    if (url === null) return
    if (!url) { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url, target: '_blank' }).run()
  }

  function addImage() {
    const url = window.prompt('Image URL (or use the upload button)')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 rounded-t-xl">
      {/* Text formatting */}
      <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
        <strong>B</strong>
      </Btn>
      <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
        <em>I</em>
      </Btn>
      <Btn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
        <span className="line-through">S</span>
      </Btn>
      <Btn active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l-4 4h4l1-1m0 0l6.5-6.5M10 16l6.5-6.5m0 0L13 6l3.5 3.5" />
        </svg>
      </Btn>
      <Btn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code">
        <span className="font-mono text-xs">{`<>`}</span>
      </Btn>

      {/* Color */}
      <div className="relative group">
        <Btn active={false} onClick={() => {}} title="Text color">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L3 20h18L12 2zm0 4l6 12H6l6-12z" />
          </svg>
        </Btn>
        <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 hidden group-hover:flex flex-wrap gap-1.5 w-28">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onMouseDown={e => { e.preventDefault(); editor.chain().focus().setColor(c).run() }}
              className="w-5 h-5 rounded-full border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetColor().run() }}
            className="w-5 h-5 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[8px] flex items-center justify-center"
            title="Remove color"
          >✕</button>
        </div>
      </div>

      <Divider />

      {/* Headings */}
      {([1, 2, 3] as const).map(level => (
        <Btn key={level} active={editor.isActive('heading', { level })} onClick={() => editor.chain().focus().toggleHeading({ level }).run()} title={`Heading ${level}`}>
          <span className="font-bold text-[11px]">H{level}</span>
        </Btn>
      ))}

      <Divider />

      {/* Lists */}
      <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </Btn>
      <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="10" y1="6" x2="20" y2="6" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="10" y1="18" x2="20" y2="18" />
          <text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontFamily="monospace">1</text>
          <text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontFamily="monospace">2</text>
          <text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontFamily="monospace">3</text>
        </svg>
      </Btn>
      <Btn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
        </svg>
      </Btn>
      <Btn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>
      </Btn>

      <Divider />

      {/* Media */}
      <Btn active={false} onClick={onImageUpload} title="Upload image">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </Btn>
      <Btn active={false} onClick={addImage} title="Insert image by URL">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 1 1.242 7.244" />
        </svg>
      </Btn>
      <Btn active={editor.isActive('link')} onClick={setLink} title="Add link">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 1 1.242 7.244" />
        </svg>
      </Btn>

      <Divider />

      {/* History */}
      <Btn active={false} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" />
        </svg>
      </Btn>
      <Btn active={false} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="15 14 20 9 15 4" /><path d="M4 20v-7a4 4 0 0 1 4-4h12" />
        </svg>
      </Btn>
    </div>
  )
}

// ── Editor ────────────────────────────────────────────────────────────────────
export default function RichTextEditor({
  onChange,
  placeholder = 'Write your content here…',
  minHeight = 280,
}: {
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Highlight,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
      TextStyle,
      Color,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none px-5 py-4',
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.isEmpty ? '' : editor.getHTML())
    },
  })

  editorRef.current = editor ?? null

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editorRef.current) return
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadEmailAsset(fd)
    if (res.url) editorRef.current.chain().focus().setImage({ src: res.url }).run()
    else alert(`Upload failed: ${res.error}`)
    e.target.value = ''
  }

  if (!editor) return null

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
      <Toolbar editor={editor} onImageUpload={() => fileRef.current?.click()} />
      <EditorContent editor={editor} />
      <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <p className="text-xs text-gray-400">Use the toolbar to add headings, colors, lists, images, and more</p>
      </div>
    </div>
  )
}
