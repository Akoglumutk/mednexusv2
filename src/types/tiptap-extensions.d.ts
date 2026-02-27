import { Editor } from '@tiptap/react'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    medTag: {
      insertMedTag: (options: { label: string; color: string }) => ReturnType
    }
    pageBreak: {
      setPageBreak: () => ReturnType
    }
  }
}