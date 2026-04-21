"use client";

import React, { useState, useEffect } from "react";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import { 
  Save, Loader2, Maximize, Palette, Settings, Type, Move, 
  ChevronRight, Smartphone, Eye, Layout, Sliders, MousePointer2, Info 
} from "lucide-react";
import { toast } from "sonner";
import { saveSiteSettings } from "../../actions/admin";
import { getFullSiteSettings } from "../../actions/settings";

const CONTROL_ELEMENTS = [
  { id: "nav", label: "شريط التنقل (Navbar)", type: "container" },
  { id: "brand", label: "بطاقة الهوية (Brand Chip)", type: "element" },
  { id: "brand_text", label: "نص المتجر", type: "text" },
  { id: "accent_text", label: "نص التمييز (المكافآت)", type: "text" },
  { id: "login_btn", label: "زر تسجيل الدخول", type: "button" },
  { id: "logout_btn", label: "زر خروج", type: "button" },
  { id: "wallet", label: "بطاقة المحفظة", type: "element" },
  { id: "admin_btn", label: "زر لوحة التحكم (السريع)", type: "button" },
  { id: "hero", label: "قسم البطل (Hero)", type: "container" },
  { id: "claim", label: "قسم استرداد الأكواد", type: "container" },
  { id: "store", label: "قسم المتجر", type: "container" },
];

export default function VisualBuilder() {
  const [items, setItems] = useState<string[]>([]);
  const [design, setDesign] = useState<Record<string, any>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getFullSiteSettings();
      setItems(data.order);
      setDesign(data.design);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    toast.loading("يتم حفظ التصميم الجديد...", { id: "builder" });
    const res = await saveSiteSettings(items, design);
    if (res.success) {
      toast.success("تم بنجاح! الموقع الآن يرتدي حلته الجديدة.", { id: "builder" });
    } else {
      toast.error(res.error, { id: "builder" });
    }
    setSaving(false);
  };

  const updateStyle = (id: string, field: string, value: any) => {
    setDesign(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-red-500" />
        <p className="text-slate-400 animate-pulse">جاري تحميل المهندس المرئي...</p>
      </div>
    );
  }

  const selectedElement = CONTROL_ELEMENTS.find(e => e.id === selectedId);

  return (
    <div className="w-full flex flex-col gap-6 relative" dir="rtl">
      {/* Top Action Bar */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-red-500/10 p-2 rounded-lg">
            <Palette className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">المهندس المرئي (Canva Style)</h1>
            <p className="text-xs text-slate-500">صمم ونسق موقعك بحرية تامة دون كود واحد</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2.5 rounded-xl transition-all ${showPreview ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}
            title="تبديل المعاينة"
          >
            <Smartphone className="w-5 h-5" />
          </button>
          <button 
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            نشر التصميم
          </button>
        </div>
      </div>

      <div className="flex gap-6 min-h-[700px]">
        {/* Sidebar Controls */}
        <div className="w-80 flex flex-col gap-6 shrink-0">
          {/* Elements Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-[28px] overflow-hidden">
            <div className="p-4 bg-slate-800/50 font-bold text-sm text-slate-300 border-b border-slate-800 flex items-center gap-2">
              <Layout className="w-4 h-4 text-red-500" />
              مكونات الموقع
            </div>
            <div className="p-2 max-h-[300px] overflow-y-auto">
              {CONTROL_ELEMENTS.map((el) => (
                <button
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  className={`w-full text-right p-3 rounded-xl transition-all flex items-center justify-between group ${
                    selectedId === el.id ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {selectedId === el.id ? <MousePointer2 className="w-4 h-4 animate-bounce" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-red-400" />}
                    <span className="text-sm font-medium">{el.label}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${selectedId === el.id ? 'opacity-100' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Style Editor Panel */}
          <AnimatePresence mode="wait">
            {selectedId ? (
              <motion.div
                key={selectedId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-slate-900 border border-slate-800 rounded-[28px] overflow-hidden flex-1"
              >
                <div className="p-4 bg-red-600 font-bold text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    <span>تعديل الخصائص</span>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="text-white/60 hover:text-white">✕</button>
                </div>

                <div className="p-5 flex flex-col gap-6 overflow-y-auto max-h-[500px]">
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">المكون المختار</span>
                    <span className="text-red-400 font-bold">{selectedElement?.label}</span>
                  </div>

                  {/* Bg Color */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                      <div className="w-1 h-3 bg-red-500 rounded-full" />
                      اللون الخلفي (Background)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={design[selectedId]?.bgColor || '#ffffff'}
                        onChange={(e) => updateStyle(selectedId, 'bgColor', e.target.value)}
                        className="w-12 h-10 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
                      />
                      <input 
                        type="text"
                        value={design[selectedId]?.bgColor || ''}
                        onChange={(e) => updateStyle(selectedId, 'bgColor', e.target.value)}
                        placeholder="أدخل كود اللون #..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 text-xs text-slate-300 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Padding / Spacing */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                      <label>الحواف الداخلية (Padding)</label>
                      <span className="text-red-500">{design[selectedId]?.padding || '0'}px</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={design[selectedId]?.padding || 0}
                      onChange={(e) => updateStyle(selectedId, 'padding', parseInt(e.target.value))}
                      className="w-full accent-red-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Border Radius */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                      <label>استدارة الحواف (Radius)</label>
                      <span className="text-red-500">{design[selectedId]?.radius || '0'}px</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" 
                      value={design[selectedId]?.radius || 0}
                      onChange={(e) => updateStyle(selectedId, 'radius', parseInt(e.target.value))}
                      className="w-full accent-red-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Scale / Size */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                      <label>التكبير/التصغير (Scale)</label>
                      <span className="text-red-500">×{design[selectedId]?.scale || '1'}</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="2" step="0.05"
                      value={design[selectedId]?.scale || 1}
                      onChange={(e) => updateStyle(selectedId, 'scale', parseFloat(e.target.value))}
                      className="w-full accent-red-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Font Color */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                      <Type className="w-3 h-3 text-red-500" />
                      لون الخط (Text Color)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={design[selectedId]?.color || '#000000'}
                        onChange={(e) => updateStyle(selectedId, 'color', e.target.value)}
                        className="w-12 h-10 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
                      />
                      <input 
                        type="text"
                        value={design[selectedId]?.color || ''}
                        onChange={(e) => updateStyle(selectedId, 'color', e.target.value)}
                        placeholder="#000000"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 text-xs text-slate-300 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Font Weight */}
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-400">وزن الخط (Weight)</label>
                     <select 
                        value={design[selectedId]?.fontWeight || 'normal'}
                        onChange={(e) => updateStyle(selectedId, 'fontWeight', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-red-500"
                     >
                        <option value="300">نحيف (Light)</option>
                        <option value="normal">عادي (Normal)</option>
                        <option value="600">عريض (SemiBold)</option>
                        <option value="bold">عريض جداً (Bold)</option>
                        <option value="900">أسود (Black)</option>
                     </select>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-[28px] p-10 flex flex-col items-center justify-center text-center gap-4 text-slate-500 flex-1">
                <Settings className="w-10 h-10 animate-[spin_4s_linear_infinite]" />
                <p className="text-sm">اختر عنصراً من القائمة أعلاه لبدء هندسته وتغيير خصائصه فوراً.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Central Layout Engine */}
        <div className="flex-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px]">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Move className="w-5 h-5 text-red-500" />
              ترتيب الأقسام (Drag & Drop)
            </h2>
            
            <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-4">
              {items.map((it) => (
                <Reorder.Item 
                  key={it} 
                  value={it} 
                  className={`bg-slate-800 border p-5 rounded-2xl cursor-grab active:cursor-grabbing flex items-center justify-between group transition-all ${
                    selectedId === it ? 'border-red-500 shadow-lg shadow-red-500/10' : 'border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-red-400">
                      <Layout className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-white block capitalize">{it} Section</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Component Layout</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedId(it); }} 
                    className="p-2 text-slate-500 hover:text-white transition-colors"
                  >
                    {selectedId === it ? <Palette className="w-5 h-5 text-red-500" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            
            <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center gap-3 text-slate-500 italic text-sm">
              <Info className="w-4 h-4" />
              <span>قم بسحب العناصر للأعلى وللأسفل لتغيير موقع القسم في الصفحة الرئيسية.</span>
            </div>
          </div>
        </div>

        {/* Mobile Preview Bridge */}
        <AnimatePresence>
          {showPreview && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-[400px] shrink-0 sticky top-24 h-fit hidden 2xl:block"
            >
              <div className="border-[12px] border-slate-900 bg-white rounded-[56px] h-[750px] w-full overflow-hidden shadow-2xl relative ring-1 ring-slate-800">
                <div className="absolute top-0 inset-x-0 h-7 bg-slate-900 z-50 flex justify-center w-full">
                  <div className="w-24 h-4 bg-slate-950 rounded-b-2xl flex items-center justify-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                    <div className="w-6 h-1 rounded-full bg-slate-800" />
                  </div>
                </div>
                <iframe src="/" className="w-full h-full pt-6 border-none" title="Live Mobile Frame" />
              </div>
              <div className="mt-4 flex items-center justify-center gap-3 text-slate-400 text-xs bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                <Eye className="w-4 h-4" />
                <span>المعاينة المباشرة للموبايل (محدثة لحظياً عند النشر)</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
