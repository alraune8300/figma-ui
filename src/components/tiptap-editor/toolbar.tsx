import { Editor } from '@tiptap/react'
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered } from 'lucide-react'

export default function Toolbar({ editor }: { editor: Editor }) {
  if (!editor) return null

  return (
    <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1 items-center">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200 text-blue-600' : ''}`}
        title="In đậm"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200 text-blue-600' : ''}`}
        title="In nghiêng"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-200 text-blue-600' : ''}`}
        title="Gạch chân"
      >
        <Underline size={16} />
      </button>
      <div className="w-[1px] h-4 bg-gray-300 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-blue-600' : ''}`}
        title="Tiêu đề 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-blue-600' : ''}`}
        title="Tiêu đề 2"
      >
        <Heading2 size={16} />
      </button>
      <div className="w-[1px] h-4 bg-gray-300 mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200 text-blue-600' : ''}`}
        title="Danh sách dấu chấm"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200 text-blue-600' : ''}`}
        title="Danh sách số"
      >
        <ListOrdered size={16} />
      </button>
    </div>
  )
}
