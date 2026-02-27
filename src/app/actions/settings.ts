"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const updates = {
    user_id: user.id,
    current_term: formData.get("current_term") as string,
    current_committee: formData.get("current_committee") as string,
    exam_date: formData.get("exam_date") as string, // ISO string from input
    today_schedule: formData.get("today_schedule") as string,
    updated_at: new Date().toISOString(),
  };

  // Upsert ensures it creates the row if it doesn't exist
  await supabase.from("settings").upsert(updates);
  
  revalidatePath("/");
}