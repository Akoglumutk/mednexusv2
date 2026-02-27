import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import EditorEngine from "@/components/editor/EditorEngine"; // <--- Ensuring this is the import

export default async function EditorPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  // 1. Fetch the document
  const { data: doc, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .single();

  // 2. Security / Error Handling
  if (error || !doc) {
    redirect("/editor"); // Bounce back if not found
  }

  // 3. RENDER THE EDITOR (Not the Canvas)
  return (
    <EditorEngine 
      docId={doc.id} 
      initialContent={doc.content} 
      title={doc.title} 
    />
  );
}