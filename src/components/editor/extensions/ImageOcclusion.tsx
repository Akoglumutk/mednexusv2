import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { EyeOff, Eye, Trash2, Square, MoveUpRight, Type, X, RotateCcw, Undo2, GripHorizontal } from 'lucide-react'

// --- TYPES ---
export interface Annotation {
  id: string;
  type: 'occlusion' | 'arrow' | 'text';
  x: number; y: number; w: number; h: number;
  revealed?: boolean;
  content?: string;
}

// --- SUB-COMPONENT: TEXT LABEL ---
const TextLabel = ({ ann, isEditMode, onUpdate, onDelete }: any) => {
  const [localText, setLocalText] = useState(ann.content || '')
  useEffect(() => { setLocalText(ann.content || '') }, [ann.content])
  const handleBlur = () => { if (localText !== ann.content) onUpdate(ann.id, localText) }

  return (
    <div className="absolute z-40" style={{ left: `${ann.x}%`, top: `${ann.y}%`, transform: 'translate(-50%, -50%)' }}>
      <div className="relative group">
        <input
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.stopPropagation()} 
          onPointerDown={(e) => e.stopPropagation()}
          disabled={!isEditMode}
          placeholder="Label..."
          className={`font-mono font-bold text-xs px-2 py-1 rounded shadow-lg transition-all text-center outline-none backdrop-blur-md
            ${isEditMode 
                ? 'bg-zinc-900/90 text-[#D4AF37] border border-[#D4AF37] cursor-text min-w-[60px]' 
                : 'bg-black/60 text-white border border-transparent cursor-default select-none'
            }`}
          style={{ width: `${Math.max(localText.length, 6) + 2}ch` }}
        />
        {isEditMode && (
           <button 
             onPointerDown={(e) => { e.stopPropagation(); onDelete(ann.id, e); }} 
             className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:scale-110"
           >
             <X size={10} />
           </button>
        )}
      </div>
    </div>
  )
}

// --- MAIN WRAPPER COMPONENT ---
function ImageOcclusionWrapper(props: any) {
  const { src, annotations, nodeId, width } = props.node.attrs
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeTool, setActiveTool] = useState<'occlusion' | 'arrow' | 'text'>('occlusion')
  
  // RESIZE STATE
  const [isResizing, setIsResizing] = useState(false)
  const [currentWidth, setCurrentWidth] = useState(width || '100%')
  const containerRef = useRef<HTMLDivElement>(null)

  // DRAWING STATE
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentShape, setCurrentShape] = useState<Partial<Annotation> | null>(null)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const arrowMarkerId = `arrowhead-${nodeId}`

  // HELPERS
  const updateAttributes = (newAnnotations: Annotation[]) => {
    props.updateAttributes({ annotations: newAnnotations })
  }
  const toggleAll = () => {
    const anyHidden = annotations.some((a: Annotation) => a.type === 'occlusion' && !a.revealed);
    const updated = annotations.map((ann: Annotation) => 
      ann.type === 'occlusion' ? { ...ann, revealed: anyHidden } : ann
    )
    updateAttributes(updated)
  }
  const undoLastAction = () => {
    if (annotations.length === 0) return;
    const newAnns = [...annotations];
    newAnns.pop();
    updateAttributes(newAnns);
  }
  const toggleReveal = (id: string) => {
    if (isEditMode) return
    const updated = annotations.map((ann: Annotation) => 
      ann.id === id && ann.type === 'occlusion' ? { ...ann, revealed: !ann.revealed } : ann
    )
    updateAttributes(updated)
  }
  const deleteAnn = (id: string, e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation()
    const updated = annotations.filter((ann: Annotation) => ann.id !== id)
    updateAttributes(updated)
  }
  const updateText = (id: string, content: string) => {
    const updated = annotations.map((ann: Annotation) => 
      ann.id === id ? { ...ann, content } : ann
    )
    updateAttributes(updated)
  }

  // --- RESIZE HANDLERS ---
  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation() 
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId); 
    setIsResizing(true)
  }

  const handleResizeMove = useCallback((e: PointerEvent) => {
    if (!isResizing || !containerRef.current) return
    const newWidth = e.clientX - containerRef.current.getBoundingClientRect().left
    setCurrentWidth(`${Math.max(300, newWidth)}px`)
  }, [isResizing])

  const handleResizeEnd = useCallback((e: PointerEvent) => {
    if (isResizing) {
      setIsResizing(false)
      props.updateAttributes({ width: currentWidth }) 
    }
  }, [isResizing, currentWidth, props])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('pointermove', handleResizeMove)
      window.addEventListener('pointerup', handleResizeEnd)
    }
    return () => {
      window.removeEventListener('pointermove', handleResizeMove)
      window.removeEventListener('pointerup', handleResizeEnd)
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  // --- DRAWING HANDLERS ---
  const getRelativeCoords = (e: React.PointerEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.PointerEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.PointerEvent).clientY
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isEditMode || isResizing) return 
    e.preventDefault()
    const { x, y } = getRelativeCoords(e)

    if (activeTool === 'text') {
      const newAnn: Annotation = { id: Math.random().toString(36).substr(2, 9), type: 'text', x, y, w: 0, h: 0, content: '' }
      updateAttributes([...annotations, newAnn])
      return
    }

    setIsDrawing(true)
    setStartPos({ x, y })
    setCurrentShape({ type: activeTool, x, y, w: x, h: y }) 
    containerRef.current?.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !isEditMode || !currentShape) return
    const { x, y } = getRelativeCoords(e)
    if (activeTool === 'occlusion') {
      setCurrentShape({ ...currentShape, x: Math.min(startPos.x, x), y: Math.min(startPos.y, y), w: Math.abs(x - startPos.x), h: Math.abs(y - startPos.y) })
    } else if (activeTool === 'arrow') {
      setCurrentShape({ ...currentShape, w: x, h: y }) 
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawing) return
    setIsDrawing(false)
    containerRef.current?.releasePointerCapture(e.pointerId)
    if (currentShape) {
      const isBoxValid = activeTool === 'occlusion' && currentShape.w! > 2 && currentShape.h! > 2;
      const isArrowValid = activeTool === 'arrow' && (Math.abs(currentShape.w! - startPos.x) > 2 || Math.abs(currentShape.h! - startPos.y) > 2);
      if (isBoxValid || isArrowValid) {
        const newAnn: Annotation = { id: Math.random().toString(36).substr(2, 9), type: activeTool, x: currentShape.x!, y: currentShape.y!, w: currentShape.w!, h: currentShape.h!, revealed: false }
        updateAttributes([...annotations, newAnn])
      }
    }
    setCurrentShape(null)
  }

  return (
    <NodeViewWrapper className="my-8 select-none animate-in fade-in duration-300 flex justify-center group/wrapper w-full touch-none">
      <div 
        ref={containerRef}
        style={{ width: currentWidth }}
        className={`
          relative rounded-xl overflow-hidden bg-[#0A0A0A] shadow-2xl transition-all min-h-[200px]
          border-2 ${isEditMode ? 'border-[#D4AF37]' : 'border-zinc-800 border-transparent'}
        `}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg className="absolute w-0 h-0"><defs><marker id={arrowMarkerId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#D4AF37" /></marker></defs></svg>

        {/* TOOLBAR */}
        <div 
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-1 bg-zinc-950/90 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
        >
          <button onClick={() => setIsEditMode(!isEditMode)} className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${isEditMode ? 'bg-[#D4AF37] text-black shadow-lg' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
            {isEditMode ? <EyeOff size={14} /> : <Eye size={14} />}
            {isEditMode ? 'Edit' : 'Study'}
          </button>
          {!isEditMode && annotations.some((a:any) => a.type === 'occlusion') && (
             <button onClick={toggleAll} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors ml-1"><RotateCcw size={14} /></button>
          )}
          {isEditMode && (
            <>
              <div className="w-px h-4 bg-zinc-800 mx-2" />
              <ToolBtn active={activeTool === 'occlusion'} onClick={() => setActiveTool('occlusion')} icon={<Square size={14} />} />
              <ToolBtn active={activeTool === 'arrow'} onClick={() => setActiveTool('arrow')} icon={<MoveUpRight size={14} />} />
              <ToolBtn active={activeTool === 'text'} onClick={() => setActiveTool('text')} icon={<Type size={14} />} />
              <div className="w-px h-4 bg-zinc-800 mx-2" />
              <button onClick={undoLastAction} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"><Undo2 size={14} /></button>
              <button onClick={props.deleteNode} className="p-2 hover:bg-red-900/20 text-zinc-500 hover:text-red-400 rounded-xl transition-colors ml-1"><Trash2 size={14} /></button>
            </>
          )}
        </div>

        {/* RESIZE HANDLE */}
        {isEditMode && (
          <div 
            onPointerDown={handleResizeStart}
            className="absolute bottom-0 right-0 p-3 cursor-col-resize text-zinc-500 hover:text-[#D4AF37] z-[100] bg-black/50 rounded-tl-xl hover:bg-black transition-colors touch-none"
            title="Drag to Resize"
          >
            <GripHorizontal size={20} />
          </div>
        )}

        {/* CANVAS */}
        <div className={`relative w-full h-auto ${isEditMode ? 'cursor-crosshair touch-none' : 'cursor-default'}`}>
             <img src={src} className="w-full h-auto block pointer-events-none select-none" draggable={false} />
             
             {/* RENDER ANNOTATIONS */}
             {annotations.map((ann: Annotation) => {
               // 1. BOXES
               if (ann.type === 'occlusion') {
                  return <div key={ann.id} onClick={(e) => { e.stopPropagation(); toggleReveal(ann.id); }} className={`absolute border-2 transition-all duration-300 z-50 ${ann.revealed ? 'bg-transparent border-dashed border-[#D4AF37]/30' : 'bg-zinc-950 border-[#D4AF37] shadow-[0_4px_20px_-4px_rgba(212,175,55,0.5)]'} ${isEditMode ? 'hover:bg-red-500/20 hover:border-red-500' : ''}`} style={{ left: `${ann.x}%`, top: `${ann.y}%`, width: `${ann.w}%`, height: `${ann.h}%` }}>{isEditMode && <button onPointerDown={(e) => deleteAnn(ann.id, e)} className="absolute -top-2 -right-2 bg-zinc-800 text-red-500 rounded-full p-0.5 z-[60] hover:scale-110"><X size={12}/></button>}</div>
               }
               // 2. ARROWS
               if (ann.type === 'arrow') {
                  return <div key={ann.id} className="absolute inset-0 pointer-events-none"><svg className="w-full h-full"><line x1={`${ann.x}%`} y1={`${ann.y}%`} x2={`${ann.w}%`} y2={`${ann.h}%`} stroke="#D4AF37" strokeWidth="2.5" markerEnd={`url(#${arrowMarkerId})`} className={isEditMode ? 'opacity-80' : 'opacity-100'} /></svg>{isEditMode && <button style={{ left: `${ann.w}%`, top: `${ann.h}%` }} onPointerDown={(e) => deleteAnn(ann.id, e)} className="absolute -translate-x-1/2 -translate-y-1/2 bg-zinc-800 text-red-500 rounded-full p-1 pointer-events-auto z-[60]"><X size={12} /></button>}</div>
               }
               // 3. TEXT
               if (ann.type === 'text') return <TextLabel key={ann.id} ann={ann} isEditMode={isEditMode} onUpdate={updateText} onDelete={deleteAnn} />
               return null;
             })}

             {/* DRAWING PREVIEW */}
             {isDrawing && currentShape && (
               currentShape.type === 'occlusion' 
                 ? <div className="absolute bg-[#D4AF37]/20 border border-[#D4AF37]" style={{ left: `${currentShape.x}%`, top: `${currentShape.y}%`, width: `${currentShape.w}%`, height: `${currentShape.h}%` }} /> 
                 : <svg className="absolute inset-0 w-full h-full pointer-events-none"><line x1={`${currentShape.x}%`} y1={`${currentShape.y}%`} x2={`${currentShape.w}%`} y2={`${currentShape.h}%`} stroke="#D4AF37" strokeWidth="2.5" strokeDasharray="4" /></svg>
             )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

function ToolBtn({ active, icon, onClick }: any) {
  return <button onClick={onClick} className={`p-1.5 rounded transition-all ${active ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'}`}>{icon}</button>
}

// --- TIPTAP EXTENSION DEFINITION ---
export const ImageOcclusion = Node.create({
  name: 'imageOcclusion',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: '100%' },
      nodeId: { default: () => `io-${Math.random().toString(36).slice(2)}` }, 
      annotations: { default: [] },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-occlusion"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-occlusion' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageOcclusionWrapper)
  },
})