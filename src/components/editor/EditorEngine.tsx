"use client"

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu' 

// Extensions
import { MedTag } from './extensions/MedTag'
import { PageBreak } from './extensions/PageBreak'
import { ImageOcclusion } from './extensions/ImageOcclusion'
import ResizableImage from './extensions/ResizableImage'

// Utils & UI
import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { askOracle } from "@/app/actions/oracle" // Server Action
import { Modal } from '@/components/ui/Modal' 
import { 
  Bold, Italic, List, Heading2, Loader2, CheckCircle2, 
  ImageIcon, Table as TableIcon, AlertCircle, Scissors,
  Eye, Sparkles, Columns, Rows, AlignCenter, Heading1, 
  Underline, ListOrdered, X, AlignLeft, AlignRight, Plus, Trash2,
  ChevronLeft
} from 'lucide-react'

import Link from 'next/link'

// --- DEBOUNCE HOOK ---
function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

interface EditorProps { initialContent: any; docId: string; title: string; }

export default function EditorEngine({ initialContent, docId, title: initialTitle }: EditorProps) {
  const supabase = createClient()
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [title, setTitle] = useState(initialTitle || "Untitled Protocol")
  
  // ORACLE STATE
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // --- ACTIONS ---
  const saveToSupabase = async (content: any, currentTitle: string) => {
    setSaveStatus('saving')
    const { error } = await supabase.from('documents').update({ content: content, title: currentTitle, updated_at: new Date().toISOString() }).eq('id', docId)
    if (error) { setSaveStatus('error') } else { setSaveStatus('saved') }
  }
  const debouncedSave = useDebounce((content: any, currentTitle: string) => saveToSupabase(content, currentTitle), 1500);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
      setTitle(e.target.value); 
      debouncedSave(editor?.getJSON(), e.target.value); 
  }

  // --- PASTE HANDLER (Forces Image Upload) ---
  const handlePaste = (view: any, event: ClipboardEvent) => {
    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find(item => item.type.startsWith('image'));
    if (imageItem) {
      event.preventDefault(); 
      const file = imageItem.getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const src = e.target?.result as string;
          editor?.chain().focus().setImage({ src }).run();
        };
        reader.readAsDataURL(file);
      }
      return true; 
    }
    return false; 
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = event => {
            const url = event.target?.result as string;
            editor?.chain().focus().setImage({ src: url }).run();
        };
        reader.readAsDataURL(file);
    }
  }

  // --- EDITOR CONFIG ---
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ blockquote: { HTMLAttributes: { class: 'callout-block' } }, dropcursor: { color: '#fbbf24', width: 2 } }),
      BubbleMenuExtension, Typography, 
      ResizableImage.configure({ allowBase64: true }),
      Table.configure({ resizable: true }), TableRow, TableHeader, TableCell, TextStyle, Color, Highlight.configure({ multicolor: true }), Placeholder.configure({ placeholder: "Start your protocol..." }), MedTag, PageBreak, ImageOcclusion
    ],
    content: initialContent || {},
    editorProps: {
      // Added pb-40 for mobile scroll comfort
      attributes: { class: 'prose prose-invert prose-lg max-w-none focus:outline-none min-h-[60vh] px-8 py-10 pb-40 bg-[#0A0A0A] border border-zinc-800 shadow-2xl rounded-xl selection:bg-[#D4AF37]/30' },
      handlePaste: handlePaste, 
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => debouncedSave(editor.getJSON(), title),
  })

  // --- COMMAND WRAPPERS ---
  const insertTable = () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  // @ts-ignore
  const insertPageBreak = () => editor?.commands.setPageBreak()
  
  const convertToOcclusion = () => {
    if (!editor) return; 
    const { state } = editor.view; 
    const { selection } = state; 
    const node = state.doc.nodeAt(selection.from);
    if (node && node.type.name === 'image') { 
        const src = node.attrs.src; 
        const width = node.attrs.width || '100%'; 
        // Replace with ImageOcclusion node
        editor.chain().focus().deleteSelection().insertContent({ type: 'imageOcclusion', attrs: { src, width } }).run(); 
    }
  }

  const runOracleScribe = async () => { 
      if (!rawInput.trim()) return; 
      setIsGenerating(true); 
      try {
        const result = await askOracle(rawInput); // Call Gemini
        if (result.success && result.content) {
            editor?.commands.clearContent();
            editor?.commands.setContent(result.content);
            setIsOracleOpen(false); 
            setRawInput(''); 
        } else {
            // Fallback if API fails
            editor?.commands.insertContent(`<blockquote>Oracle Error: ${result.error}</blockquote>`);
        }
      } catch (e) { console.error(e); } 
      finally { setIsGenerating(false); }
  };

  const MED_TAGS = [{ id: 'exam', label: 'SINAV', color: '#ef4444' }, { id: 'note', label: 'HOCA', color: '#3b82b6' }, { id: 'tus', label: 'TUS', color: '#f59e0b' }, { id: 'extra', label: 'EK', color: '#10b981' }];
  const insertMedTag = (label: string, color: string) => { 
     // @ts-ignore
     editor?.chain().focus().insertMedTag({ label, color }).run(); 
  };

  if (!editor) return null

  return (
    <div className="relative min-h-screen bg-[#050505] selection:bg-amber-500/30">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-md border-b border-zinc-900/50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link 
            href="/editor" 
            className="flex items-center gap-2 text-zinc-400 hover:text-[#D4AF37] transition-colors active:scale-95"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-bold hidden md:inline">Back</span>
          </Link>
          <input value={title} onChange={handleTitleChange} placeholder="Untitled Protocol..." className="bg-transparent text-xl font-serif font-bold text-zinc-100 placeholder:text-zinc-800 outline-none w-full" />
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800">
             {saveStatus === 'saving' && <Loader2 size={12} className="animate-spin text-amber-500"/>}
             {saveStatus === 'saved' && <CheckCircle2 size={12} className="text-emerald-500"/>}
          </div>
        </div>
      </header>
   
      {/* CANVAS AREA */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <EditorContent editor={editor} />
      </main>
   
      {/* FLOATING TOOLBAR (Fixed Bottom) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] overflow-x-auto no-scrollbar rounded-2xl">
        <div className="flex items-center gap-1 p-1.5 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
           
           {/* Table Specific Controls */}
           {editor.isActive('table') && (
            <div className="flex items-center gap-1 px-2 border-r border-zinc-700 mr-1">
                 <ToolbarBtn onClick={() => editor.chain().focus().addColumnAfter().run()}><Columns size={16} className="text-zinc-300"/><Plus size={10} className="text-emerald-500 absolute -top-1 -right-1"/></ToolbarBtn>
                 <ToolbarBtn onClick={() => editor.chain().focus().deleteColumn().run()}><Columns size={16} className="text-zinc-500"/><X size={10} className="text-red-500 absolute -top-1 -right-1"/></ToolbarBtn>
                 <ToolbarBtn onClick={() => editor.chain().focus().addRowAfter().run()}><Rows size={16} className="text-zinc-300"/><Plus size={10} className="text-emerald-500 absolute -top-1 -right-1"/></ToolbarBtn>
                 <ToolbarBtn onClick={() => editor.chain().focus().deleteRow().run()}><Rows size={16} className="text-zinc-500"/><X size={10} className="text-red-500 absolute -top-1 -right-1"/></ToolbarBtn>
                 <ToolbarBtn onClick={() => editor.chain().focus().deleteTable().run()}><Trash2 size={16} className="text-red-400"/></ToolbarBtn>
            </div>
           )}

           <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={18} /></ToolbarBtn>
           <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={18} /></ToolbarBtn>
           <div className="w-px h-4 bg-zinc-800 mx-1" />
           <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={18} /></ToolbarBtn>
           <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={18} /></ToolbarBtn>
           <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={18} /></ToolbarBtn>
           
           <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
           <ToolbarBtn onClick={() => fileInputRef.current?.click()}><ImageIcon size={18} /></ToolbarBtn>

           <div className="w-px h-4 bg-zinc-800 mx-1" />
           <ToolbarBtn onClick={insertTable}><TableIcon size={18} /></ToolbarBtn>
           <ToolbarBtn onClick={insertPageBreak}><Scissors size={18} /></ToolbarBtn>
           <div className="w-px h-4 bg-zinc-800 mx-1" />
           
           <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-xl border border-white/5">
            {MED_TAGS.map(tag => (
              <button key={tag.id} onClick={() => insertMedTag(tag.label, tag.color)} className="group relative flex items-center justify-center w-7 h-7 rounded-lg transition-all active:scale-95" style={{ backgroundColor: `${tag.color}15`, border: `1px solid ${tag.color}40` }}>
                <span className="text-[10px] font-bold" style={{ color: tag.color }}>{tag.label[0]}</span>
              </button>
            ))}
          </div>
          
          <button onClick={() => setIsOracleOpen(true)} className="p-2 text-amber-500 hover:bg-amber-500/10 active:scale-95 rounded-xl transition-all relative group">
              <Sparkles size={18} />
          </button>
        </div>
      </div>

      {/* ORACLE MODAL */}
      { isOracleOpen && (
        <Modal isOpen={isOracleOpen} onClose={() => setIsOracleOpen(false)} title="Oracle Scribe" primaryAction={runOracleScribe} primaryLabel={isGenerating ? "Processing..." : "Scribe"}>
             <textarea autoFocus value={rawInput} onChange={(e) => setRawInput(e.target.value)} placeholder="Ham metni buraya yapıştır..." className="w-full h-48 bg-black/30 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-300 outline-none focus:border-[#D4AF37]" />
        </Modal>
      )}

      {/* BUBBLE MENU */}
      {editor && BubbleMenu && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100, zIndex: 9999 }} 
          shouldShow={({ editor }: { editor: any }) => editor.isActive('image') || editor.isActive('imageOcclusion')}
        >
           <div className="flex items-center gap-1 p-1.5 bg-zinc-900/95 backdrop-blur border border-zinc-700 rounded-xl shadow-xl">
              <button onClick={() => editor.chain().focus().updateAttributes(editor.isActive('imageOcclusion') ? 'imageOcclusion' : 'image', { class: 'float-left mr-4' }).run()} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"><AlignLeft size={16}/></button>
              <button onClick={() => editor.chain().focus().updateAttributes(editor.isActive('imageOcclusion') ? 'imageOcclusion' : 'image', { class: 'mx-auto block' }).run()} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"><AlignCenter size={16}/></button>
              <button onClick={() => editor.chain().focus().updateAttributes(editor.isActive('imageOcclusion') ? 'imageOcclusion' : 'image', { class: 'float-right ml-4' }).run()} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"><AlignRight size={16}/></button>
              
              {/* Only show 'Study' button if it's NOT already an occlusion node */}
              {!editor.isActive('imageOcclusion') && (
                  <>
                     <div className="w-px h-4 bg-zinc-700 mx-1" />
                     <button onClick={convertToOcclusion} className="p-1.5 text-[#D4AF37] hover:text-white hover:bg-[#D4AF37]/20 rounded flex items-center gap-1 transition-all" title="Study Mode">
                        <Eye size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-wider pr-1">Study</span>
                     </button>
                  </>
              )}
           </div>
        </BubbleMenu>
      )}
      
      <style jsx global>{`
        .ProseMirror { outline: none !important; color: #d4d4d8; font-size: 1.125rem; line-height: 1.8; }
        .ProseMirror h1 { font-size: 2.25rem; color: #D4AF37; font-family: 'Georgia', serif; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; }
        .callout-block { border-left: 4px solid #f59e0b; background: rgba(245, 158, 11, 0.05); padding: 1.5rem; border-radius: 0 1rem 1rem 0; margin: 2rem 0; }
        .med-tag-component { color: var(--tag-color); border: 1px solid var(--tag-color); background-color: color-mix(in srgb, var(--tag-color), transparent 90%); padding: 1px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 4px; display: inline-flex; align-items: center; vertical-align: middle; }
        [data-type="med-tag"] { display: inline-flex; align-items: center; justify-content: center; line-height: 1; height: 1.5em; font-size: 0.7rem !important; font-weight: 800 !important; padding: 0 0.5rem; border-radius: 4px; user-select: none; cursor: default; }
      `}</style>
    </div>
  )
}

function ToolbarBtn({ onClick, children }: { onClick: () => void, children: React.ReactNode }) {
  return <button onClick={onClick} className="relative p-2 rounded-lg text-zinc-400 transition-all duration-75 active:text-[#D4AF37] active:bg-zinc-800 active:scale-95">{children}</button>

}
