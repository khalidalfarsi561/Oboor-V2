"use client";

import React, { useState, useEffect } from "react";
import { Reorder } from "framer-motion";
import { Save, Loader2, Maximize } from "lucide-react";
import { toast } from "sonner";
import { saveSiteSettings } from "../../actions/admin";

export default function VisualBuilder() {
  const [items, setItems] = useState(["hero", "claim", "store"]);
  const [saving, setSaving] = useState(false);

  // In a real DB we'd fetch this first
  useEffect(() => {
    // Optionally fetch initial layout state here if extending DB logic
  }, []);

  const handleSave = async () => {
    setSaving(true);
    toast.loading("يتم تطبيق الهندسة الجديدة للموقع...", { id: "builder" });
    const res = await saveSiteSettings(items);
    if(res.success) {
      toast.success("تم التحديث! سيتم تطبيق الترتيب الجديد فوراً على صفحات الزوار.", { id: "builder" });
    } else {
      toast.error(res.error, { id: "builder" });
    }
    setSaving(false);
  };

  const getLabel = (id: string) => {
    if(id === "hero") return "قسم البطل والبانر (Hero Section)";
    if(id === "claim") return "نموذج استخراج الكود (Claim Section)";
    if(id === "store") return "متجر المنتجات (Store Section)";
    return id;
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-10">
      <div className="flex-1">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">المهندس المرئي (Drag & Drop)</h1>
            <p className="text-slate-400">بدون أكواد! اسحب وأفلت لترتيب عناصر الصفحة الرئيسية للموقع بالكامل.</p>
          </div>
          <button 
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            نشر التعديلات
          </button>
        </header>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px]">
          <h2 className="text-lg font-bold text-slate-300 mb-6 flex items-center gap-2">
            <Maximize className="w-5 h-5 text-red-500" />
            الهيكل التكويني للصفحة الرئيسية
          </h2>
          
          <Reorder.Group axis="y" values={items} onReorder={setItems} className="flex flex-col gap-4">
            {items.map((item) => (
              <Reorder.Item 
                key={item} 
                value={item} 
                className="bg-slate-800 border border-slate-700 p-5 rounded-2xl cursor-grab active:cursor-grabbing flex items-center justify-between group shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-red-400 transition-colors">
                    <span className="font-mono text-sm block">::</span>
                  </div>
                  <span className="text-lg font-bold text-slate-200">{getLabel(item)}</span>
                </div>
                <div className="text-xs font-mono text-slate-500 bg-slate-900 px-3 py-1 rounded-lg">ID: {item}</div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <p className="mt-8 text-sm text-slate-500">تم تنشيط ميزة الحفظ التلقائي للهيكل. انقر ونشر التعديلات للحفظ النهائي بالتطبيق.</p>
        </div>
      </div>

      <div className="w-full lg:w-[400px] h-full sticky top-10 hidden xl:block">
        <div className="border-[8px] border-slate-800 bg-white rounded-[48px] h-[800px] w-full overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 inset-x-0 h-7 bg-slate-800 z-50 flex justify-center rounded-b-3xl w-40 mx-auto">
            <div className="w-12 h-1 bg-slate-900 rounded-full mt-2"></div>
          </div>
          <iframe src="/" className="w-full h-full pt-6 scale-95 origin-top" title="Mobile Preview" />
        </div>
      </div>
    </div>
  );
}
