"use client";

import React, { useState } from "react";
import { useAuth } from "../AuthProvider";
import { useUserBalance } from "../../hooks/useUserBalance";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogIn, LogOut, Gift, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { StoreItems } from "../StoreItems";
import { NotificationCenter } from "../NotificationCenter";
import { claimRewardCode } from "../../actions/rewards";
import { HomeHero } from "./HomeHero";
import { HomeClaim } from "./HomeClaim";

export function HomeClient({ stockMap, layoutOrder = ["hero", "claim", "store"], design = {} }: { stockMap: Record<number, number> | null, layoutOrder?: string[], design?: any }) {
  const { user, loading, signIn, signOut } = useAuth();
  const { balance, isBalanceLoading } = useUserBalance(user?.uid);
  
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [claiming, setClaiming] = useState(false);

  // Dynamic Styles Mapping
  const getStyle = (componentId: string) => {
    return design[componentId] || {};
  };

  const commonSectionStyles = (id: string) => {
    const s = getStyle(id);
    return {
      borderRadius: s.radius ? `${s.radius}px` : undefined,
      backgroundColor: s.bgColor || undefined,
      padding: s.padding ? `${s.padding}px` : undefined,
      transform: s.scale ? `scale(${s.scale})` : undefined,
    };
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً.");
      return;
    }
    if (!code.trim() || code.trim().length !== 8) {
      setErrorMsg("تأكد من إدخال كود صحيح مكون من 8 رموز.");
      return;
    }

    setClaiming(true);
    try {
      const result = await claimRewardCode(user.uid, code);

      if (!result.success || result.error) {
        setErrorMsg(result.error || "حدث خطأ غير متوقع أثناء معالجة الكود.");
        return;
      }

      toast.success(`تم بنجاح! تمت إضافة ${result.amount}$ إلى رصيدك.`, {
        icon: <CheckCircle2 className="text-green-500 w-5 h-5" />
      });
      setCode("");
      
      const { default: confetti } = await import("canvas-confetti");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#2563eb", "#4f46e5", "#38bdf8"]
      });

    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setClaiming(false);
    }
  };

  if (loading || (user && isBalanceLoading && balance === null)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div aria-busy="true"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      </div>
    );
  }

  const componentsMap: Record<string, React.ReactNode> = {
    hero: <HomeHero key="hero" user={user} signIn={signIn} style={commonSectionStyles("hero")} />,
    claim: <HomeClaim key="claim" user={user} handleClaim={handleClaim} code={code} setCode={setCode} claiming={claiming} errorMsg={errorMsg} setErrorMsg={setErrorMsg} style={commonSectionStyles("claim")} />,
    store: <StoreItems key="store" balance={balance} stockMap={stockMap} style={commonSectionStyles("store")} />,
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 relative">
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-50 to-transparent pointer-events-none" />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative z-10">
        
        {/* Navbar */}
        <header className="flex flex-row items-center justify-between mb-8 md:mb-16 group/nav" style={getStyle("nav")}>
          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md border border-slate-200/50 pl-6 pr-4 py-2 rounded-2xl shadow-sm hover:shadow-md transition-all hover:bg-white hover:-translate-y-0.5" style={getStyle("brand")}>
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0" style={getStyle("icon_bg")}>
              <Gift className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap" style={getStyle("brand_text")}>
              متجر <span className="text-blue-600" style={getStyle("accent_text")}>المكافآت</span>
            </h1>
          </div>

          <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 w-full md:w-auto">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  {user.email === "khalidalfarsi1995@gmail.com" && (
                    <Link 
                      href="/admin" 
                      className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-slate-800 transition-all hover:scale-110 shadow-lg shadow-slate-900/10"
                      title="لوحة التحكم"
                      style={getStyle("admin_btn")}
                    >
                      <Gift className="w-5 h-5" />
                    </Link>
                  )}
                  <NotificationCenter userId={user.uid} />
                </div>

                <div className="flex items-center justify-center gap-2 bg-white shadow-sm border border-slate-200 px-4 py-2 rounded-full w-full sm:w-auto" dir="ltr" title="الرصيد/المحفظة" style={getStyle("wallet")}>
                  <AnimatePresence mode="popLayout">
                    <motion.span 
                      key={balance}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="font-bold text-slate-800 text-base md:text-lg inline-block"
                    >
                      ${balance !== null ? balance : "..."} 
                    </motion.span>
                  </AnimatePresence>
                  <Wallet className="w-5 h-5 text-blue-600" style={getStyle("wallet_icon")} />
                </div>
                <button
                  onClick={signOut}
                  title="تسجيل الخروج"
                  className="flex items-center justify-center p-2 text-slate-400 hover:text-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-full"
                  style={getStyle("logout_btn")}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={signIn}
                title="تسجيل الدخول"
                className="flex items-center justify-center gap-2 bg-blue-700 text-white shadow-sm hover:shadow-lg hover:shadow-blue-700/20 px-7 py-2.5 rounded-full font-medium transition-all duration-200 w-full sm:w-auto hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                style={getStyle("login_btn")}
              >
                <LogIn className="w-4 h-4 ml-1" />
                تسجيل الدخول
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Builder Core */}
        {layoutOrder.map((sectionId) => componentsMap[sectionId])}

      </main>
    </div>
  );
}
