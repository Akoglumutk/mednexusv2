import Image from '@tiptap/extension-image'
import { mergeAttributes, ReactNodeViewRenderer } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import { useCallback, useEffect, useState } from 'react'
import { Eye } from 'lucide-react' // Import Icon

const ResizableImageComponent = (props: any) => {
  const [width, setWidth] = useState(props.node.attrs.width || '100%')
  const [resizing, setResizing] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  // Mouse events for resizing
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setResizing(true)
    setStartX(e.clientX)
    const currentWidth = (e.currentTarget.parentElement?.querySelector('img')?.offsetWidth) || 0
    setStartWidth(currentWidth)
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!resizing) return
    const diff = e.clientX - startX
    const newWidth = startWidth + diff
    setWidth(`${newWidth}px`)
  }, [resizing, startX, startWidth])

  const onMouseUp = useCallback(() => {
    if (resizing) {
      setResizing(false)
      props.updateAttributes({ width })
    }
  }, [resizing, width, props])

  useEffect(() => {
    if (resizing) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [resizing, onMouseMove, onMouseUp])

  // NEW: Convert to Occlusion Logic directly inside the component
  const handleConvertToOcclusion = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (typeof props.getPos === 'function') {
        const pos = props.getPos();
        const { src } = props.node.attrs;
        
        // Replace current image node with imageOcclusion node
        props.editor.chain()
             .focus()
             .deleteRange({ from: pos, to: pos + 1 })
             .insertContentAt(pos, {
                 type: 'imageOcclusion',
                 attrs: { src, width }
             })
             .run();
    }
  };

  return (
    <NodeViewWrapper className="relative flex justify-center max-w-full my-4 group/image">
      <div className={`relative transition-all ${props.selected ? 'ring-2 ring-[#D4AF37]' : ''}`}>
        <img
          src={props.node.attrs.src}
          alt={props.node.attrs.alt}
          style={{ width: width, maxWidth: '100%' }}
          className={`rounded-lg ${props.node.attrs.class || 'mx-auto block'}`}
        />
        
        {/* PERMANENT "STUDY" BUTTON (Top Right) */}
        <button
          onClick={handleConvertToOcclusion}
          className="absolute top-2 right-2 bg-black/80 text-[#D4AF37] border border-[#D4AF37]/50 p-2 rounded-lg hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-lg z-20 flex items-center gap-1"
          title="Convert to Study Mode"
        >
            <Eye size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Study</span>
        </button>

        {/* Resize Handle (Bottom Right) */}
        <div
          onMouseDown={onMouseDown}
          className="absolute right-0 bottom-0 w-8 h-8 cursor-ew-resize flex items-end justify-end p-1 z-20 opacity-0 group-hover/image:opacity-100 transition-opacity"
        >
            <div className="w-3 h-3 bg-[#D4AF37] rounded-sm border border-black" />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export default Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: '100%' },
      class: { default: 'mx-auto block' },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },
})