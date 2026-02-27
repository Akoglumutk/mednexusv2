"use client";

import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  primaryAction?: () => void;
  primaryLabel?: string;
  danger?: boolean; // Red button for delete
}

export function Modal({ isOpen, onClose, title, children, primaryAction, primaryLabel, danger }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Content */}
      <div className="relative w-full max-w-sm bg-[#121212] border border-white/10 rounded-xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
          <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        
        <div className="p-6">
          {children}
        </div>

        {primaryAction && (
          <div className="p-4 bg-zinc-900/50 border-t border-white/10 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 text-xs font-bold text-zinc-400 bg-zinc-800 rounded-lg active:scale-95 transition-transform">
              CANCEL
            </button>
            <button 
              onClick={primaryAction} 
              className={`flex-1 py-3 text-xs font-bold rounded-lg active:scale-95 transition-transform text-black ${danger ? 'bg-red-500 hover:bg-red-400' : 'bg-[#D4AF37] hover:bg-[#b5952f]'}`}
            >
              {primaryLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}