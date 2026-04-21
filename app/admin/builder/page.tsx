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
import { HomeHero } from "../../components/home/HomeHero";
import { HomeClaim } from "../../components/home/HomeClaim";
import { StoreItems } from "../../components/StoreItems";
import { Wallet, Gift, LogOut, LogIn } from "lucide-react";

const CONTROL_ELEMENTS = [
  { id: "nav", label: "شريط التنقل (Navbar)", type: "container", area: "header" },
  { id: "brand", label: "بطاقة الهوية (Brand Chip)", type: "element", area: "header" },
  { id: "brand_text", label: "نص المتجر", type: "text", area: "header" },
  { id: "accent_text", label: "نص التمييز (المكافآت)", type: "text", area: "header" },
  { id: "login_btn", label: "زر تسجيل الدخول", type: "button", area: "header" },
  { id: "logout_btn", label: "زر خروج", type: "button", area: "header" },
  { id: "wallet", label: "بطاقة المحفظة", type: "element", area: "header" },
  { id: "admin_btn", label: "زر لوحة التحكم (السريع)", type: "button", area: "header" },
  { id: "hero", label: "قسم البطل (Hero)", type: "container", area: "content" },
  { id: "claim", label: "قسم استرداد الأكواد", type: "container", area: "content" },
  { id: "store", label: "قسم المتجر", type: "container", area: "content" },
];

const FocusWrapper = ({ 
  id, 
  children, 
  selectedId, 
  setSelectedId, 
  hoveredId, 
  setHoveredId, 
  className = "" 
}: { 
  id: string, 
  children: React.ReactNode, 
  selectedId: string | null,
  setSelectedId: (id: string | null) => void,
  hoveredId: string | null,
  setHoveredId: (id: string | null) => void,
  className?: string 
}) => {
  const isSelected = selectedId === id;
  const isHovered = hoveredId === id;
  const label = CONTROL_ELEMENTS.find(e => e.id === id)?.label;

  return (
    <div 
      className={`relative group/focus ${className} transition-all`}
      onMouseEnter={() => setHoveredId(id)}
      onMouseLeave={() => setHoveredId(null)}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(id);
      }}
    >
      <AnimatePresence>
        {(isHovered || isSelected) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute -inset-2 border-2 z-40 pointer-events-none rounded-xl transition-colors ${
              isSelected ? 'border-red-500 ring-4 ring-red-500/10' : 'border-blue-400 border-dashed'
            }`}
          >
            <div className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-sm ${
              isSelected ? 'bg-red-500' : 'bg-blue-400'
            }`}>
              {label} {isSelected && "• المحدد"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={isSelected ? 'relative z-10' : ''}>
        {children}
      </div>
    </div>
  );
};

export default function VisualBuilder() {
  const [items, setItems] = useState<string[]>([]);
  const [design, setDesign] = useState<Record<string, any>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

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

  const getStyle = (id: string) => design[id] || {};

  const componentsMap: Record<string, React.ReactNode> = {
    hero: (
      <FocusWrapper id="hero" key="hero" className="mb-8" selectedId={selectedId} setSelectedId={setSelectedId} hoveredId={hoveredId} setHoveredId={setHoveredId}>
        <HomeHero user={{}} signIn={() => {}} style={getStyle("hero")} />
      </FocusWrapper>
    ),
    claim: (
      <FocusWrapper id="claim" key="claim" className="mb-8" selectedId={selectedId} setSelectedId={setSelectedId} hoveredId={hoveredId} setHoveredId={setHoveredId}>
        <HomeClaim user={{ uid: "test" }} handleClaim={() => {}} code="" setCode={() => {}} claiming={false} errorMsg="" setErrorMsg={() => {}} style={getStyle("claim")} />
      </FocusWrapper>
    ),
    store: (
      <FocusWrapper id="store" key="store" className="mb-8" selectedId={selectedId} setSelectedId={setSelectedId} hoveredId={hoveredId} setHoveredId={setHoveredId}>
        <StoreItems balance={100} stockMap={{}} style={getStyle("store")} />
      </FocusWrapper>
    ),
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-red-500" />
        <p className="text-slate-400 animate-pulse">جاري تحضير بيئة التصميم الحية...</p>
      </div>
    );
  }

  const selectedElement = CONTROL_ELEMENTS.find(e => e.id === selectedId);

  return (
    <div className="w-full flex h-[calc(100vh-100px)] overflow-hidden bg-slate-950 rounded-[40px] border border-slate-800 shadow-2xl" dir="rtl">
      
      {/* Sidebar Inspector (Right Side for RTL) */}
      <aside className="w-80 border-r border-slate-800 bg-slate-900 overflow-y-auto flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 bg-slate-800/30">
          <div className="flex items-center justify-between mb-4">
             <h2 className="font-bold text-white flex items-center gap-2">
               <Settings className="w-5 h-5 text-red-500" />
               المفتش (Inspector)
             </h2>
             <button 
               disabled={saving}
               onClick={handleSave}
               className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg shadow-lg shadow-red-600/10 transition-all font-bold"
               title="حفظ التغييرات"
             >
               {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             </button>
          </div>
          <p className="text-xs text-slate-500">اضغط على أي عنصر في المعاينة لتعديل خصائصه هنا فوراً.</p>
        </div>

        <div className="flex-1 p-5">
           <AnimatePresence mode="wait">
             {selectedId ? (
               <motion.div
                 key={selectedId}
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="flex flex-col gap-6"
               >
                 <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                    <span className="text-[10px] uppercase font-black text-slate-600 block mb-1 tracking-tighter">العنصر المحدد</span>
                    <h3 className="text-red-400 font-bold">{selectedElement?.label}</h3>
                 </div>

                 {/* Style Controls */}
                 <div className="space-y-6">
                    {/* Background */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">الخلفية</label>
                      <div className="flex gap-2">
                        <input type="color" value={getStyle(selectedId).bgColor || '#ffffff'} onChange={(e) => updateStyle(selectedId, 'bgColor', e.target.value)} className="w-10 h-8 rounded border-none bg-transparent cursor-pointer" />
                        <input type="text" value={getStyle(selectedId).bgColor || ''} onChange={(e) => updateStyle(selectedId, 'bgColor', e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-300" placeholder="#hex" />
                      </div>
                    </div>

                    {/* Padding & Radius */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400">الحواف ({getStyle(selectedId).padding || 0}px)</label>
                        <input type="range" min="0" max="60" value={getStyle(selectedId).padding || 0} onChange={(e) => updateStyle(selectedId, 'padding', parseInt(e.target.value))} className="w-full h-1.5 accent-red-500 bg-slate-800 rounded-lg appearance-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400">الاستدارة ({getStyle(selectedId).radius || 0}px)</label>
                        <input type="range" min="0" max="50" value={getStyle(selectedId).radius || 0} onChange={(e) => updateStyle(selectedId, 'radius', parseInt(e.target.value))} className="w-full h-1.5 accent-red-500 bg-slate-800 rounded-lg appearance-none" />
                      </div>
                    </div>

                    {/* Scale */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400">الحجم (×{getStyle(selectedId).scale || 1})</label>
                      <input type="range" min="0.5" max="1.5" step="0.05" value={getStyle(selectedId).scale || 1} onChange={(e) => updateStyle(selectedId, 'scale', parseFloat(e.target.value))} className="w-full h-1.5 accent-red-500 bg-slate-800 rounded-lg appearance-none" />
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                       <label className="text-xs font-black text-slate-600 block mb-4 uppercase">ترتيب العناصر</label>
                       <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
                         {items.map(it => (
                           <Reorder.Item key={it} value={it} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 flex items-center justify-between cursor-grab group">
                             <div className="flex items-center gap-3">
                               <Move className="w-3 h-3 text-slate-500 group-hover:text-red-500" />
                               <span className="text-[11px] font-bold text-slate-300 capitalize">{it}</span>
                             </div>
                           </Reorder.Item>
                         ))}
                       </Reorder.Group>
                    </div>
                 </div>
               </motion.div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-4 text-slate-500">
                  <MousePointer2 className="w-10 h-10 opacity-20" />
                  <p className="text-sm italic">اضغط على أي جزء تفاعلي في معاينة الموقع للبدء في هندسته وتعديل ملامحه.</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </aside>

      {/* Main Canvas Workspace */}
      <section className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-y-auto relative p-10 flex justify-center items-start">
        {/* Device Toggle */}
        <div className="absolute top-4 inset-x-0 mx-auto w-fit bg-white/80 backdrop-blur border border-slate-200 p-1.5 rounded-2xl flex gap-1 z-50 shadow-sm shadow-slate-200/50">
          <button onClick={() => setViewMode("desktop")} className={`p-2 rounded-xl transition-all ${viewMode === "desktop" ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Maximize className="w-4 h-4" /></button>
          <button onClick={() => setViewMode("mobile")} className={`p-2 rounded-xl transition-all ${viewMode === "mobile" ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Smartphone className="w-4 h-4" /></button>
        </div>

        <motion.div 
          layout
          className={`bg-slate-50 min-h-screen shadow-2xl transition-all duration-500 relative origin-top ${
            viewMode === "mobile" ? 'w-[375px] rounded-[50px] border-[12px] border-slate-900 overflow-hidden' : 'w-full max-w-5xl rounded-3xl'
          }`}
        >
          {/* Header Mock */}
          <FocusWrapper id="nav" selectedId={selectedId} setSelectedId={setSelectedId} hoveredId={hoveredId} setHoveredId={setHoveredId}>
            <header className="p-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b" style={getStyle("nav")}>
              <FocusWrapper id="brand" selectedId={selectedId} setSelectedId={setSelectedId} hoveredId={hoveredId} setHoveredId={setHoveredId}>
                <div className="flex items-center gap-3 bg-white border border-slate-200 pl-4 pr-3 py-1.5 rounded-2xl shadow-sm" style={getStyle("brand")}>
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20" style={getStyle("icon_bg")}>
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-sm font-bold text-slate-900" style={getStyle("brand_text")}>
                    متجر <span className="text-blue-600" style={getStyle("accent_text")}>المكافآت</span>
                  </h1>
                </div>
              </FocusWrapper>

              <div className="flex items-center gap-3">
                 <FocusWrapper id="wallet" selectedId={selectedId} setSelectedId={setSelectedId} hoveredId={hoveredId} setHoveredId={setHoveredId}>
                   <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm text-xs" style={getStyle("wallet")}>
                     <span className="font-bold">$100.00</span>
                     <Wallet className="w-4 h-4 text-blue-600" style={getStyle("wallet_icon")} />
                   </div>
                 </FocusWrapper>
                 <FocusWrapper id="logout_btn" selectedId={selectedId} setSelectedId={setSelectedId} hoveredId={hoveredId} setHoveredId={setHoveredId}>
                   <button className="p-2 text-slate-400" style={getStyle("logout_btn")}><LogOut className="w-4 h-4" /></button>
                 </FocusWrapper>
              </div>
            </header>
          </FocusWrapper>

          {/* Actual Site Sections from items order */}
          <div className="p-8">
            {items.map(it => componentsMap[it])}
          </div>

          {/* Canvas Indicator */}
          <div className="py-20 text-center opacity-10 flex flex-col items-center gap-2">
            <Layout className="w-12 h-12" />
            <span className="text-4xl font-black">END OF PAGE</span>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
