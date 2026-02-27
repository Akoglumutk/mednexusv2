import { createClient } from "@/utils/supabase/server";
import FileManager from "@/components/editor/FileManager";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function EditorDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // FIX: Explicitly get folders OR 'text' files. Exclude 'canvas'.
  const { data: docs } = await supabase
    .from('documents')
    .select('id, title, is_folder, parent_id, type, updated_at')
    .eq('user_id', user?.id)
    .or('type.eq.folder,type.eq.text') // <--- STRICT FILTER
    .order('title', { ascending: true });

  return (
    <main className="min-h-screen bg-[#050505] p-6 md:p-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-[#D4AF37] text-sm mb-2 transition-colors">
            <ChevronLeft size={14} /> Back to Portal
          </Link>
          <h1 className="text-3xl font-serif tracking-wider text-[#D4AF37]">
            The Scriptorium
          </h1>
        </div>
      </header>

      {/* Pass 'editor' mode */}
      <FileManager initialDocs={docs || []} mode="editor" />
    </main>
  );
}