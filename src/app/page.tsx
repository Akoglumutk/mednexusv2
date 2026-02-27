import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AcademicBar from "@/components/dashboard/AcademicBar";
import Link from "next/link";
import { BookOpen, ChevronRight, LayoutGrid } from "lucide-react";

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch settings for the Academic Bar
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <main className="min-h-screen bg-[#050505] p-6 md:p-12">
      
      {/* HEADER SECTION */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-2">Welcome Back</p>
           <h1 className="text-4xl md:text-5xl font-serif font-bold text-zinc-100">
             Med<span className="text-[#D4AF37]">Nexus</span>
           </h1>
        </div>

        {/* NEW: NAVIGATION LINKS */}
        <div className="flex items-center gap-3">
          <Link 
            href="/guide" 
            className="group flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all"
          >
            <BookOpen size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Guide</span>
          </Link>

          <Link 
            href="/editor" 
            className="group flex items-center gap-2 px-6 py-2 bg-[#D4AF37] text-black rounded-full font-bold hover:bg-[#b5952f] transition-all"
          >
            <span className="text-xs uppercase tracking-wider">Enter Scriptorium</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
          </Link>
        </div>
      </header>

      {/* ACADEMIC STATUS BAR */}
      <AcademicBar initialSettings={settings} />

      {/* QUICK ACTIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/editor" className="group p-8 bg-[#121212] border border-white/5 rounded-2xl hover:border-[#D4AF37]/50 transition-all relative overflow-hidden">
           <div className="absolute top-0 right-0 p-32 bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#D4AF37]/10 transition-colors" />
           <h3 className="text-2xl font-serif text-zinc-100 mb-2 group-hover:text-[#D4AF37] transition-colors">The Scriptorium</h3>
           <p className="text-zinc-500 text-sm mb-6">Lectures, Protocols & Intelligent Notes</p>
           <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 uppercase tracking-widest group-hover:text-zinc-300">
             Open Library <ChevronRight size={12} />
           </div>
        </Link>

        <Link href="/canvas" className="group p-8 bg-[#121212] border border-white/5 rounded-2xl hover:border-purple-500/50 transition-all relative overflow-hidden">
           <div className="absolute top-0 right-0 p-32 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors" />
           <h3 className="text-2xl font-serif text-zinc-100 mb-2 group-hover:text-purple-400 transition-colors">The Canvas</h3>
           <p className="text-zinc-500 text-sm mb-6">Anatomy Sketching & Histology Lab</p>
           <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 uppercase tracking-widest group-hover:text-zinc-300">
             Open Studio <ChevronRight size={12} />
           </div>
        </Link>
      </div>

    </main>
  );
}