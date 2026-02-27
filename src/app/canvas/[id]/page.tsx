import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

// 1. Dynamic Import Here (The Guard)
const MedCanvas = dynamic(
  () => import("@/components/canvas/MedCanvas"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen bg-[#050505] flex items-center justify-center text-[#D4AF37]">
        Loading Canvas...
      </div>
    )
  }
);

export default async function CanvasPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: doc, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !doc) {
    redirect("/canvas");
  }

  return (
    <MedCanvas 
      docId={doc.id} 
      initialData={doc.content} 
      title={doc.title} 
    />
  );
}