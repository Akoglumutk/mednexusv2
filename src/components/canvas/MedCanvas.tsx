"use client";

import { useState, useCallback, useRef } from "react";
import { ChevronLeft, Save, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Excalidraw, WelcomeScreen, MainMenu } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

interface CanvasProps { docId: string; initialData: any; title: string; }

export default function MedCanvas({ docId, initialData, title }: CanvasProps) {
  const supabase = createClient();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  const saveToSupabase = async (elements: any, appState: any) => {
    setSaveStatus('saving');
    const content = { elements, appState: { viewBackgroundColor: appState.viewBackgroundColor } };
    const { error } = await supabase.from('documents').update({ content, updated_at: new Date().toISOString() }).eq('id', docId);
    if (error) { setSaveStatus('error'); } else { setSaveStatus('saved'); }
  };

  const debouncedSave = useDebounce((elements, appState) => saveToSupabase(elements, appState), 1000);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#050505] overflow-hidden">
      
      {/* 1. DEDICATED HEADER BAR (Solves Overlap) */}
      <div className="h-14 shrink-0 border-b border-white/10 bg-[#121212] flex items-center justify-between px-4 z-10">
        <Link 
          href="/canvas" 
          className="flex items-center gap-2 text-zinc-400 hover:text-[#D4AF37] transition-colors active:scale-95"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-bold hidden md:inline">Back</span>
        </Link>

        <div className="flex items-center gap-2">
           <span className="text-sm font-bold text-zinc-200">{title}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/5">
           {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin text-[#D4AF37]"/>}
           {saveStatus === 'saved' && <CheckCircle2 size={14} className="text-emerald-500"/>}
           {saveStatus === 'error' && <Save size={14} className="text-red-500"/>}
           <span className="text-[10px] uppercase text-zinc-500 font-mono hidden sm:inline">{saveStatus}</span>
        </div>
      </div>

      {/* 2. CANVAS AREA */}
      <div className="flex-1 w-full relative">
        <Excalidraw
          theme="dark"
          initialData={{
            elements: initialData?.elements || [],
            appState: { ...initialData?.appState, viewBackgroundColor: "#050505", currentItemStrokeColor: "#D4AF37", currentItemBackgroundColor: "transparent" },
            scrollToContent: true
          }}
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          onChange={(elements, appState) => { if (excalidrawAPI) debouncedSave(elements, appState); }}
          UIOptions={{
            canvasActions: { changeViewBackgroundColor: false, clearCanvas: true, loadScene: false, saveToActiveFile: false, toggleTheme: false, saveAsImage: true },
          }}
        >
          <MainMenu>
            <MainMenu.DefaultItems.SaveAsImage />
            <MainMenu.DefaultItems.ClearCanvas />
            <MainMenu.DefaultItems.ChangeCanvasBackground />
          </MainMenu>
        </Excalidraw>
      </div>
    </div>
  );
}