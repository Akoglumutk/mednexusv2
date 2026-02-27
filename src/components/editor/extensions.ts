import { mergeAttributes, Node } from '@tiptap/core'

// --- MED TAG EXTENSION ---
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    medTag: {
      insertMedTag: (options: { label: string; color: string }) => ReturnType
    }
  }
}

export const MedTag = Node.create({
  name: 'medTag',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,
  addAttributes() {
    return {
      label: { default: 'TAG', parseHTML: element => element.getAttribute('label') },
      color: { default: '#ef4444', parseHTML: element => element.getAttribute('color') },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-type="med-tag"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'med-tag',
        class: 'med-tag-component',
        style: `--tag-color: ${HTMLAttributes.color};`,
      }),
      HTMLAttributes.label,
    ]
  },
  addCommands() {
    return {
      insertMedTag: (options) => ({ commands }) => {
        return commands.insertContent([
          { type: this.name, attrs: options },
          { type: 'text', text: ' ' } 
        ])
      },
    }
  },
})

// --- PAGE BREAK EXTENSION ---
export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'page-break', class: 'page-break-indicator' })]
  },
  addCommands() {
    return {
      setPageBreak: () => ({ chain }) => {
        return chain().insertContent({ type: this.name }).focus().run()
      },
    }
  },
})

// --- SPOILER STUB (To prevent import errors) ---
export const Spoiler = Node.create({
    name: 'spoiler',
    group: 'inline',
    inline: true,
    content: 'text*',
    renderHTML({ HTMLAttributes }) {
      return ['span', mergeAttributes(HTMLAttributes, { class: 'blur-sm hover:blur-none transition-all cursor-pointer bg-zinc-800' }), 0]
    }
})