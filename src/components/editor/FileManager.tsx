"use client";

import { useState } from "react";
import { Folder, FileText, PenTool, ChevronRight, Plus, Trash2, Edit2, CornerUpLeft } from "lucide-react";
import { createItem, deleteItem, renameItem } from "@/app/editor/actions";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";

interface Doc { id: string; title: string; is_folder: boolean; parent_id: string | null; type: string; updated_at: string; }

export default function FileManager({ initialDocs, mode = 'editor' }: { initialDocs: Doc[], mode?: 'editor' | 'canvas' }) {
  // ... (Keep existing State: currentFolder, folderStack) ...
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderStack, setFolderStack] = useState<{id: string, name: string}[]>([]);
  const router = useRouter();
  
  const currentItems = initialDocs.filter(doc => doc.parent_id === currentFolder);
  currentItems.sort((a, b) => {
    if (a.is_folder === b.is_folder) return a.title.localeCompare(b.title);
    return a.is_folder ? -1 : 1;
  });

  const enterFolder = (folderId: string, folderName: string) => { setFolderStack([...folderStack, { id: folderId, name: folderName }]); setCurrentFolder(folderId); };
  const goUp = () => { const newStack = [...folderStack]; newStack.pop(); setFolderStack(newStack); setCurrentFolder(newStack.length > 0 ? newStack[newStack.length - 1].id : null); };

  // --- NEW: MODAL STATE ---
  const [modal, setModal] = useState<{ type: 'create'|'rename'|'delete'|null, itemId?: string, itemName?: string, itemType?: 'folder'|'text'|'canvas' }>({ type: null });
  const [inputVal, setInputVal] = useState("");

  const handleAction = async () => {
    if (modal.type === 'create') {
      if (!inputVal) return;
      await createItem(currentFolder, modal.itemType!, inputVal);
    } else if (modal.type === 'rename') {
      if (!inputVal) return;
      await renameItem(modal.itemId!, inputVal);
    } else if (modal.type === 'delete') {
      await deleteItem(modal.itemId!);
    }
    setModal({ type: null });
    setInputVal("");
    router.refresh();
  };

  const openCreate = (type: 'folder'|'text'|'canvas') => { setModal({ type: 'create', itemType: type }); setInputVal(""); };
  const openRename = (id: string, name: string) => { setModal({ type: 'rename', itemId: id }); setInputVal(name); };
  const openDelete = (id: string, name: string) => { setModal({ type: 'delete', itemId: id, itemName: name }); };

  return (
    <div className="bg-[#121212] border border-white/10 rounded-xl min-h-[600px] flex flex-col shadow-2xl">
      {/* 1. Toolbar */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/50 rounded-t-xl sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2 text-sm text-gray-400 overflow-x-auto no-scrollbar whitespace-nowrap mask-linear-fade">
          <button onClick={() => { setCurrentFolder(null); setFolderStack([]); }} className={`hover:text-[#D4AF37] transition-colors ${currentFolder === null ? 'text-[#D4AF37] font-bold' : ''}`}>Root</button>
          {folderStack.map((folder, i) => (
            <div key={folder.id} className="flex items-center gap-2">
              <ChevronRight size={14} className="text-zinc-600" />
              <button onClick={() => { const newStack = folderStack.slice(0, i + 1); setFolderStack(newStack); setCurrentFolder(folder.id); }} className={`hover:text-[#D4AF37] transition-colors ${i === folderStack.length - 1 ? 'text-[#D4AF37] font-bold' : ''}`}>{folder.name}</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 shrink-0 ml-4">
          {currentFolder && <button onClick={goUp} className="p-3 text-zinc-400 active:text-white bg-zinc-900 active:bg-zinc-800 rounded-lg mr-2 active:scale-95"><CornerUpLeft size={18} /></button>}
          <button onClick={() => openCreate('folder')} className="p-3 bg-zinc-900 text-zinc-300 rounded-lg border border-zinc-800 active:scale-95" title="New Folder"><Plus size={18} /></button>
          {mode === 'editor' ? (
            <button onClick={() => openCreate('text')} className="p-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg border border-[#D4AF37]/50 active:scale-95"><FileText size={18} /></button>
          ) : (
            <button onClick={() => openCreate('canvas')} className="p-3 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/50 active:scale-95"><PenTool size={18} /></button>
          )}
        </div>
      </div>

      {/* 2. File List */}
      <div className="flex-1 p-2 md:p-4 overflow-y-auto">
        {currentItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-4 opacity-70">
            {mode === 'editor' ? <Folder size={64} strokeWidth={1} /> : <PenTool size={64} strokeWidth={1} />}
            <p className="text-sm font-medium">Empty {mode === 'editor' ? 'Archive' : 'Canvas'} Directory</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {currentItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/30 border border-white/5 active:bg-zinc-900 transition-colors">
                <div className="flex-1 flex items-center gap-4 min-w-0 mr-4 cursor-pointer" onClick={() => { if (item.is_folder) { enterFolder(item.id, item.title); } else { const route = item.type === 'canvas' ? '/canvas' : '/editor'; router.push(`${route}/${item.id}`); } }}>
                  <div className="shrink-0">
                    {item.is_folder ? <Folder size={24} className="text-blue-400 fill-blue-400/10" /> : item.type === 'canvas' ? <PenTool size={24} className="text-purple-400" /> : <FileText size={24} className="text-[#D4AF37]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base text-gray-200 font-medium truncate">{item.title || "Untitled"}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{new Date(item.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); openRename(item.id, item.title); }} className="p-3 text-zinc-500 hover:text-white active:bg-zinc-800 rounded-lg transition-colors"><Edit2 size={20} /></button>
                  <button onClick={(e) => { e.stopPropagation(); openDelete(item.id, item.title); }} className="p-3 text-zinc-500 hover:text-red-400 active:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={20} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. UNIVERSAL MODAL */}
      <Modal 
        isOpen={!!modal.type} 
        onClose={() => setModal({ type: null })}
        title={modal.type === 'delete' ? 'Confirm Delete' : modal.type === 'create' ? `New ${modal.itemType}` : 'Rename Item'}
        primaryAction={handleAction}
        primaryLabel={modal.type === 'delete' ? 'Delete' : 'Save'}
        danger={modal.type === 'delete'}
      >
        {modal.type === 'delete' ? (
          <p className="text-zinc-400 text-sm">Are you sure you want to delete <span className="text-white font-bold">{modal.itemName}</span>? This cannot be undone.</p>
        ) : (
          <input 
            autoFocus 
            value={inputVal} 
            onChange={(e) => setInputVal(e.target.value)} 
            placeholder={modal.type === 'create' ? `Name your ${modal.itemType}...` : "Enter new name..."}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none focus:border-[#D4AF37]"
            onKeyDown={(e) => e.key === 'Enter' && handleAction()}
          />
        )}
      </Modal>
    </div>
  );
}