"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Edit2, Save, X, Plus, Trash2, Check, Edit3 } from "lucide-react";
import { updateSettings } from "@/app/actions/settings";
import { createClient } from "@/utils/supabase/client";

interface Settings {
  current_term: string;
  current_committee: string;
  exam_date: string;
  today_schedule: any[];
}

export default function AcademicBar({ initialSettings }: { initialSettings: Settings | null }) {
  const [isGlobalEditing, setIsGlobalEditing] = useState(false);
  const [isScheduleEditing, setIsScheduleEditing] = useState(false);
  const [scheduleRows, setScheduleRows] = useState<any[]>(
    Array.isArray(initialSettings?.today_schedule) ? initialSettings.today_schedule : []
  );
  
  const [timeLeft, setTimeLeft] = useState("");
  const supabase = createClient();

  const data = initialSettings || {
    current_term: "Year 3",
    current_committee: "Internal Medicine",
    exam_date: new Date().toISOString(),
    today_schedule: [],
  };

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const exam = new Date(data.exam_date).getTime();
      const distance = exam - now;
      if (distance < 0) {
        setTimeLeft("EXAM PASSED");
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setTimeLeft(`${days}d ${hours}h`);
      }
    };
    calculateTime();
    const timer = setInterval(calculateTime, 1000 * 60);
    return () => clearInterval(timer);
  }, [data.exam_date]);

  const handleScheduleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('settings').upsert({ user_id: user.id, today_schedule: scheduleRows }, { onConflict: 'user_id' }); 
      setIsScheduleEditing(false);
    } catch (error) { console.error(error); }
  };

  const cancelScheduleEdit = () => {
    setScheduleRows(Array.isArray(data.today_schedule) ? data.today_schedule : []);
    setIsScheduleEditing(false);
  };

  return (
    <div className="w-full bg-[#121212] border-l-4 border-[#D4AF37] rounded-r-xl p-6 mb-12 shadow-2xl shadow-black/50 min-h-[220px]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch h-full">
        
        {/* COL 1 & 2: IDENTITY & EXAM */}
        {isGlobalEditing ? (
          <form 
            action={async (formData) => { await updateSettings(formData); setIsGlobalEditing(false); }}
            className="col-span-1 md:col-span-2 flex flex-col justify-center bg-black/40 p-6 rounded-lg border border-white/10 space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-2 block">Current Term</label>
                  <input name="current_term" defaultValue={data.current_term} className="w-full h-10 bg-zinc-950 border border-zinc-700 px-3 text-gray-200 rounded focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm transition-all placeholder:text-zinc-700" placeholder="e.g. Year 3" />
                </div>
                <div>
                  <label className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-2 block">Committee</label>
                  <input name="current_committee" defaultValue={data.current_committee} className="w-full h-10 bg-zinc-950 border border-zinc-700 px-3 text-gray-200 rounded focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm transition-all placeholder:text-zinc-700" placeholder="e.g. Cardiology" />
                </div>
            </div>
            <div>
              <label className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-2 block">Exam Date</label>
              <input type="datetime-local" name="exam_date" defaultValue={data.exam_date ? data.exam_date.substring(0, 16) : ""} className="w-full h-10 bg-zinc-950 border border-zinc-700 px-3 text-gray-200 rounded focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm transition-all [color-scheme:dark]" />
            </div>
            <input type="hidden" name="today_schedule" value={JSON.stringify(scheduleRows)} />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsGlobalEditing(false)} className="px-4 py-2 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#D4AF37] text-black text-xs font-bold rounded hover:bg-[#b5952f] transition-colors flex items-center gap-2"><Save size={14}/> Save Changes</button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex flex-col justify-center relative pl-2">
              <div className="flex items-start justify-between">
                <div>
                   <h2 className="text-[#D4AF37] font-serif text-2xl tracking-wide leading-tight">{data.current_committee}</h2>
                   <p className="text-gray-500 text-xs uppercase tracking-[0.2em] mt-2 font-medium">{data.current_term}</p>
                </div>
                <button onClick={() => setIsGlobalEditing(true)} className="p-2 text-zinc-600 hover:text-[#D4AF37] hover:bg-zinc-900 rounded-lg transition-all">
                  <Edit2 size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l md:border-r border-white/5 py-6 md:py-0 px-6 bg-white/[0.02] md:bg-transparent rounded-lg md:rounded-none">
              <div className="bg-[#D4AF37]/10 p-4 rounded-full text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <Clock size={28} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Time Remaining</p>
                <p className="text-3xl font-mono text-gray-200 font-bold tracking-tight">{timeLeft || "..."}</p>
              </div>
            </div>
          </>
        )}

        {/* COL 3: SCHEDULE */}
        <div className="md:pl-4 flex flex-col h-full relative">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold">
              <Calendar size={14} /> Today's Brief
            </div>
            <div className="flex gap-1">
              {isScheduleEditing ? (
                 <>
                   <button onClick={cancelScheduleEdit} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-all"><X size={16} /></button>
                   <button onClick={handleScheduleSave} className="p-1.5 text-emerald-500 hover:bg-emerald-900/20 rounded transition-all"><Check size={16} /></button>
                 </>
              ) : (
                 <button onClick={() => setIsScheduleEditing(true)} className="p-1.5 text-zinc-600 hover:text-[#D4AF37] hover:bg-zinc-900 rounded transition-all"><Edit3 size={16} /></button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[200px] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {scheduleRows.length === 0 && !isScheduleEditing && (
              <p className="text-xs text-zinc-600 italic text-center py-8 border border-dashed border-white/5 rounded-lg">No tasks scheduled.</p>
            )}

            {scheduleRows.map((row: any, i: number) => (
              <div key={i} className={`flex gap-3 items-center group ${isScheduleEditing ? 'bg-zinc-950 p-2 rounded border border-zinc-800' : 'py-1 border-b border-white/5 last:border-0'}`}>
                {isScheduleEditing ? (
                  <>
                    <input type="time" value={row.time} onChange={(e) => { const newRows = [...scheduleRows]; newRows[i].time = e.target.value; setScheduleRows(newRows); }} className="w-24 bg-zinc-900 border border-zinc-700 text-xs p-1.5 rounded text-[#D4AF37] outline-none focus:border-[#D4AF37]" />
                    <input value={row.subject} placeholder="Task..." onChange={(e) => { const newRows = [...scheduleRows]; newRows[i].subject = e.target.value; setScheduleRows(newRows); }} className="flex-1 bg-zinc-900 border border-zinc-700 text-xs p-1.5 rounded text-zinc-200 outline-none focus:border-[#D4AF37]" />
                    <button onClick={() => setScheduleRows(scheduleRows.filter((_, idx) => idx !== i))} className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-900/20 rounded"><Trash2 size={14}/></button>
                  </>
                ) : (
                  <div className="w-full flex items-start gap-4">
                    <span className="text-[#D4AF37] font-mono text-xs font-bold shrink-0 mt-0.5 px-1.5 py-0.5 bg-[#D4AF37]/10 rounded">{row.time}</span>
                    <span className="text-zinc-300 text-sm leading-tight">{row.subject}</span>
                  </div>
                )}
              </div>
            ))}

            {isScheduleEditing && (
              <button onClick={() => setScheduleRows([...scheduleRows, { time: "09:00", subject: "" }])} className="w-full mt-2 border border-dashed border-zinc-800 py-3 rounded text-[10px] text-zinc-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                <Plus size={14} /> Add Session
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}