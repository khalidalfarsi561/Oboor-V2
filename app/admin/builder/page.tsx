"use client";

import React, { useState, useEffect, useRef } from "react";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import { 
  Save, Loader2, Maximize, Palette, Settings, Type, Move, 
  ChevronRight, Smartphone, Eye, Layout, Sliders, MousePointer2, Info,
  Sparkles, Send, Bot, RefreshCcw, X
} from "lucide-react";
import { toast } from "sonner";
import { GoogleGenAI } from "@google/genai";
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
  { id: "icon_bg", label: "خلفية أيقونة الشعار", type: "element", area: "header" },
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
      className={`relative group/focus ${className} cursor-crosshair transition-all`}
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
            <div className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-sm flex items-center gap-1 ${
              isSelected ? 'bg-red-500' : 'bg-blue-400'
            }`}>
              <Sparkles className="w-2.5 h-2.5" />
              {label} {isSelected && "• المحدد للذكاء الاصطناعي"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`${isSelected ? 'relative z-10' : ''}`}>
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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const aiInputRef = useRef<HTMLInputElement>(null);

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

  const applyAiStyling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || aiLoading) return;
    
    setAiLoading(true);
    const toastId = toast.loading("جاري تحليل طلبك وتنفيذ التعديلات...", { id: "ai-style" });

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API key is not configured.");

      const ai = new GoogleGenAI({ apiKey });
      const currentElementStyle = design[selectedId || "global"] || {};
      const elementName = CONTROL_ELEMENTS.find(e => e.id === selectedId)?.label || "Global Page";

      const prompt = `You are an expert Frontend AI Stylist. 
Selected Element: ${elementName} (id: ${selectedId || "global"})
Current Style JSON: ${JSON.stringify(currentElementStyle)}
User Request: ${aiPrompt}

Rules:
1. Return ONLY a valid JSON object representing the UPDATED style for THIS element.
2. The style can include camelCase valid CSS properties that will be passed to a React 'style' prop.
3. Common keys: bgColor, padding, radius, scale, color, fontWeight, fontSize, borderRadius, backgroundColor, etc.
4. Support Arabic RTL context. Ensure colors are modern, vibrant, and professional.
5. Do NOT include Markdown code blocks, only the JSON.

Example Response: {"backgroundColor": "#ff0000", "padding": "20px", "borderRadius": "15px"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const rawJson = response.text?.replace(/```json|```/g, "").trim();
      if (!rawJson) throw new Error("AI returned an empty response.");

      const newStyles = JSON.parse(rawJson);
      
      setDesign(prev => ({
        ...prev,
        [selectedId || "global"]: {
          ...prev[selectedId || "global"],
          ...newStyles
        }
      }));
      
      setAiPrompt("");
      toast.success("تم تنفيذ التعديل بنجاح عبر الذكاء الاصطناعي!", { id: "ai-style" });
    } catch (err: any) {
      console.error(err);
      toast.error(`فشل التعديل: ${err.message}`, { id: "ai-style" });
    } finally {
      setAiLoading(false);
    }
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
    <div className="w-full flex h-[calc(100vh-100px)] overflow-hidden bg-slate-950 rounded-[40px] border border-slate-800 shadow-2xl relative" dir="rtl">
      
      {/* Sidebar - UI Sections Ordering & Publishing */}
      <aside className="w-72 border-r border-slate-800 bg-slate-900 overflow-y-auto flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 bg-slate-800/30">
          <div className="flex items-center justify-between mb-4">
             <h2 className="font-bold text-white flex items-center gap-2">
               <Sparkles className="w-5 h-5 text-red-500" />
               الذكاء الاصطناعي
             </h2>
             <button 
               disabled={saving}
               onClick={handleSave}
               className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-red-600/10 transition-all font-bold text-sm flex items-center gap-2"
             >
               {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               نشر الموقع
             </button>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">تم حذف التعديل اليدوي. استخدم ذكاء المنصة لتغيير أي شيء تراه في المعاينة.</p>
        </div>

        <div className="flex-1 p-5 space-y-8">
            <div className="bg-slate-800/20 p-4 rounded-3xl border border-slate-800">
               <h3 className="text-xs font-black text-slate-600 uppercase mb-4 tracking-tighter">ترتيب عناصر الموقع</h3>
               <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
                 {items.map(it => (
                   <Reorder.Item key={it} value={it} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 flex items-center justify-between cursor-grab group transition-all hover:bg-slate-800">
                     <div className="flex items-center gap-3">
                       <Move className="w-3 h-3 text-slate-500 group-hover:text-red-500" />
                       <span className="text-[11px] font-bold text-slate-300 capitalize">{it}</span>
                     </div>
                   </Reorder.Item>
                 ))}
               </Reorder.Group>
            </div>

            <div className="bg-slate-900 border border-slate-700/50 p-4 rounded-3xl">
               <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                 <Bot className="w-4 h-4 text-red-500" />
                 رؤية التصميم
               </h4>
               <p className="text-[10px] text-slate-400 leading-relaxed italic">&quot;تخيل موقعك كما تريده، وسأقوم بهندسته لك في ثوانٍ. اضغط على أي عنصر وابدأ الحوار.&quot;</p>
            </div>
        </div>
      </aside>

      {/* Workspace Canvas */}
      <section className="flex-1 bg-[#0a0a0a] overflow-hidden relative flex flex-col">
        {/* Device & Toolbar */}
        <div className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8 shrink-0 backdrop-blur-xl">
           <div className="flex items-center gap-6">
             <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
               <button onClick={() => setViewMode("desktop")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === "desktop" ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Maximize className="w-3 h-3" /> ديسكتوب</button>
               <button onClick={() => setViewMode("mobile")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === "mobile" ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><Smartphone className="w-3 h-3" /> جوال</button>
             </div>
             <div className="h-4 w-[1px] bg-slate-800" />
             <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800">
               <MousePointer2 className="w-3 h-3 text-red-500" />
               <span className="text-[10px] font-black text-slate-500 uppercase">Focus & Annotate Mode ACTIVE</span>
             </div>
           </div>

           <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  setDesign({});
                  toast.success("تم تصفير التصميم، عدنا للبداية!");
                }}
                className="text-xs text-slate-500 hover:text-white transition-all flex items-center gap-1"
              >
                <RefreshCcw className="w-3 h-3" /> تصفير
              </button>
           </div>
        </div>

        {/* Viewport Center */}
        <div className="flex-1 overflow-y-auto p-12 flex justify-center items-start scrollbar-hide">
          <motion.div 
            layout
            className={`bg-white min-h-screen shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all duration-700 relative origin-top ${
              viewMode === "mobile" ? 'w-[375px] rounded-[50px] border-[12px] border-[#1a1a1a] overflow-hidden' : 'w-full max-w-5xl rounded-2xl'
            }`}
          >
            {/* Real Header Mapping */}
            <FocusWrapper id="nav" selectedId={selectedId} setSelectedId={setSelectedId} hoveredId={hoveredId} setHoveredId={setHoveredId}>
              <header className="p-6 flex items-center justify-between border-b" style={getStyle("nav")}>
                <FocusWrapper id="brand" selectedId={selectedId} setSelectedId={setSelectedId} hoveredId={hoveredId} setHoveredId={setHoveredId}>
                  <div className="flex items-center gap-3 bg-white border border-slate-200 pl-4 pr-3 py-1.5 rounded-2xl shadow-sm" style={getStyle("brand")}>
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center" style={getStyle("icon_bg")}>
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

            {/* Dynamic Content Sections */}
            <div className="p-0">
              {items.map(it => componentsMap[it])}
            </div>
          </motion.div>
        </div>

        {/* AI Command Center (Bottom Fixed Overlay) */}
        <div className="absolute inset-x-0 bottom-10 flex justify-center px-10 pointer-events-none">
           <AnimatePresence>
             {selectedId ? (
               <motion.div 
                 initial={{ y: 50, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: 50, opacity: 0 }}
                 className="w-full max-w-2xl pointer-events-auto"
               >
                 <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-700 p-2 rounded-[32px] shadow-2xl flex items-center gap-3 ring-8 ring-slate-950/20">
                    <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-xs shrink-0 whitespace-nowrap">
                       <Sparkles className="w-3 h-3 animate-pulse" />
                       تعديل {selectedElement?.label}
                    </div>
                    <form onSubmit={applyAiStyling} className="flex-1 flex gap-2">
                       <input 
                         ref={aiInputRef}
                         autoFocus
                         type="text" 
                         placeholder="أخبر الذكاء الاصطناعي ماذا تريد أن تفعل بهذا العنصر..." 
                         className="flex-1 bg-transparent px-4 py-2 text-sm text-white focus:outline-none placeholder:text-slate-600"
                         value={aiPrompt}
                         onChange={(e) => setAiPrompt(e.target.value)}
                         disabled={aiLoading}
                       />
                       <button 
                         type="submit"
                         disabled={aiLoading || !aiPrompt.trim()}
                         className="p-3 bg-white text-slate-950 rounded-2xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 flex items-center justify-center shrink-0"
                       >
                         {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                       </button>
                       <div className="w-[1px] h-6 bg-slate-800 self-center mx-1" />
                       <button 
                         type="button"
                         onClick={() => setSelectedId(null)}
                         className="p-3 text-slate-500 hover:text-white transition-all"
                       >
                         <X className="w-4 h-4" />
                       </button>
                    </form>
                 </div>
               </motion.div>
             ) : (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="text-xs bg-slate-900/50 backdrop-blur border border-slate-800 text-slate-500 px-6 py-3 rounded-full flex items-center gap-3"
               >
                 <Info className="w-4 h-4 text-blue-500" />
                 اضغط على أي عنصر في المعاينة لتشغيل محرك تعديل الذكاء الاصطناعي
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
