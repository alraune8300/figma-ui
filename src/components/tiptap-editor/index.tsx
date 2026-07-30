import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Toolbar from './toolbar'

export default function TiptapEditor({ minHeight = 400 }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline, Link, Image],
    content: '<p>Bắt đầu gõ nội dung văn bản của bạn tại đây...</p>',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none p-4',
        style: `min-height: ${minHeight}px`,
      },
    },
  })

  if (!editor) return null

  return (
    <div className="w-full border border-gray-200 rounded-md bg-white overflow-hidden">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

