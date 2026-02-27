"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createItem(parentId: string | null, type: 'folder' | 'text' | 'canvas', name: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      parent_id: parentId, // NULL if root
      title: name,
      is_folder: type === 'folder',
      type: type,
      content: type === 'folder' ? null : {} // Empty content for files
    })
    .select()
    .single();

  if (error) console.error("Create Error:", error);
  revalidatePath('/editor');
  return data;
}

export async function deleteItem(id: string) {
  const supabase = createClient();
  await supabase.from('documents').delete().eq('id', id);
  revalidatePath('/editor');
}

export async function renameItem(id: string, newName: string) {
  const supabase = createClient();
  await supabase.from('documents').update({ title: newName }).eq('id', id);
  revalidatePath('/editor');
}