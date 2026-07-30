import TiptapEditor from './components/tiptap-editor'

export default function NewFilePage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-800 font-sans">
      
      {/* SIDEBAR TRÁI - Bạn có thể đắp màu sắc/icon theo Figma vào đây */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between p-4 hidden md:flex">
        <div>
          <div className="flex items-center gap-2 px-2 py-3 border-b border-gray-100 mb-4">
            <span className="font-bold text-lg text-blue-600">Figma UI Workspace</span>
          </div>
          <nav className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md bg-blue-50 text-blue-700 font-medium text-sm">
              📄 Tài liệu trống mới
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 font-medium text-sm">
              📁 Thư mục nội bộ
            </a>
          </nav>
        </div>
        <div className="p-2 text-xs text-gray-400 border-t border-gray-100 pt-3">
          Phiên bản thử nghiệm v1.0
        </div>
      </aside>

      {/* VÙNG LÀM VIỆC CHÍNH */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* THANH TIÊU ĐỀ ĐẦU TRANG */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Tài liệu</span>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-sm text-gray-700">Untitled Document</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ● Đã lưu đám mây
            </span>
          </div>
        </header>

        {/* VÙNG CHỨA TỜ GIẤY SOẠN THẢO VĂN BẢN TIPTAP */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-gray-50">
          <div className="w-full max-w-4xl h-fit">
            {/* Bộ não gõ chữ Tiptap thông minh được gọi tại đây */}
            <TiptapEditor minHeight={500} />
          </div>
        </div>

      </main>

    </div>
  )
}
