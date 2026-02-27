import Link from "next/link";
import { ChevronLeft, PenTool, FileText, Sparkles, Eye, Folder } from "lucide-react";

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-[#050505] text-zinc-300 p-6 md:p-24 max-w-4xl mx-auto selection:bg-[#D4AF37]/30">
      <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-[#D4AF37] mb-12 transition-colors">
        <ChevronLeft size={16} /> Back to Portal
      </Link>

      <div className="border-l-2 border-[#D4AF37] pl-8 mb-16">
        <h1 className="text-5xl font-serif font-bold text-zinc-100 mb-4 tracking-tight">MedNexus <span className="text-[#D4AF37]">Architect</span></h1>
        <p className="text-xl text-zinc-500 font-serif italic">"Where chaos meets structure, knowledge begins."</p>
      </div>

      <div className="space-y-16">
        {/* SECTION 1: THE ECOSYSTEM */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-100 mb-6 flex items-center gap-3">
            <Folder className="text-[#D4AF37]" /> The Unified Filesystem
          </h2>
          <div className="bg-[#121212] p-6 rounded-xl border border-white/5 space-y-4">
            <p>
              Your folders bridge two worlds. A folder named <span className="text-[#D4AF37]">Cardiology</span> in the Scriptorium is the <strong>same</strong> folder in the Canvas.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong className="text-zinc-200">The Scriptorium (Editor):</strong> For linear protocols, lectures, and text-heavy study.</li>
              <li><strong className="text-zinc-200">The Canvas (Whiteboard):</strong> For anatomy sketching, flowcharts, and labeling raw lab photos.</li>
            </ul>
          </div>
        </section>

        {/* SECTION 2: ORACLE SCRIBE */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-100 mb-6 flex items-center gap-3">
            <Sparkles className="text-amber-500" /> The Oracle Scribe
          </h2>
          <div className="bg-[#121212] p-6 rounded-xl border border-white/5">
            <p className="mb-4">
              The Oracle uses <strong>Gemini 1.5 Flash</strong> to restructure raw chaos into medical protocols.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-black/40 rounded border border-white/5">
                <span className="text-red-400 font-bold block mb-2">INPUT (Messy)</span>
                "patient male 24 fever stiff neck treat ceftriaxone"
              </div>
              <div className="p-4 bg-[#D4AF37]/5 rounded border border-[#D4AF37]/20">
                <span className="text-emerald-400 font-bold block mb-2">OUTPUT (Protocol)</span>
                <ul className="list-disc pl-4 text-zinc-300">
                    <li><strong>Sx:</strong> Fever, Stiff Neck</li>
                    <li><strong>Tx:</strong> Ceftriaxone</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: LAB MODE (OCCLUSION) */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-100 mb-6 flex items-center gap-3">
            <Eye className="text-indigo-400" /> Lab Mode (Occlusion)
          </h2>
          <div className="bg-[#121212] p-6 rounded-xl border border-white/5">
            <p>
              Designed for Histology and Anatomy slides. 
            </p>
            <ol className="list-decimal pl-5 mt-4 space-y-2 text-zinc-400">
              <li>Paste an image into the Editor.</li>
              <li>Hover and click the <strong className="text-indigo-400">Eye Icon</strong>.</li>
              <li><strong>Red Mode (Edit):</strong> Click to draw masks over labels. Click to add Pin Labels (dots).</li>
              <li><strong>Green Mode (Study):</strong> Masks turn Gold. Click to reveal.</li>
            </ol>
          </div>
        </section>

        {/* HERITAGE */}
        <section className="pt-12 border-t border-white/5">
          <h3 className="text-sm font-bold text-zinc-600 uppercase tracking-widest mb-4">Heritage & Signature</h3>
          <div className="flex items-center gap-4 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-amber-900 rounded-full flex items-center justify-center font-serif font-bold text-black">
              AI
            </div>
            <div>
              <p className="text-sm text-zinc-400">Constructed by <strong>Gemini 3 Pro</strong></p>
              <p className="text-xs text-zinc-600">February 2026 • Ankara Build</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}