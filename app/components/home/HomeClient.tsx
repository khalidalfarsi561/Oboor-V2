"use client";

import React, { useState } from "react";
import { useAuth } from "../AuthProvider";
import { useUserBalance } from "../../hooks/useUserBalance";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogIn, LogOut, Gift, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { StoreItems } from "../StoreItems";
import { claimRewardCode } from "../../actions/rewards";

export function HomeClient({ stockMap }: { stockMap: Record<number, number> | null }) {
  const { user, loading, signIn, signOut } = useAuth();
  const { balance, isBalanceLoading } = useUserBalance(user?.uid);
  
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [claiming, setClaiming] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 relative">
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-50 to-transparent pointer-events-none" />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative z-10">
        
        {/* Navbar */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 md:mb-16 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              متجر <span className="text-blue-600">المكافآت</span>
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full md:w-auto">
            {user ? (
              <>
                <div className="flex items-center justify-center gap-2 bg-white shadow-sm border border-slate-200 px-5 py-2.5 rounded-full w-full sm:w-auto" dir="ltr" title="الرصيد/المحفظة">
                  <AnimatePresence mode="popLayout">
                    <motion.span 
                      key={balance}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="font-bold text-slate-800 text-lg inline-block"
                    >
                      ${balance !== null ? balance : "..."} 
                    </motion.span>
                  </AnimatePresence>
                  <Wallet className="w-5 h-5 text-blue-600" />
                </div>
                <button
                  onClick={signOut}
                  title="تسجيل الخروج"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-red-500 transition-colors w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-full"
                >
                  <LogOut className="w-4 h-4 ml-1" />
                  تسجيل خروج
                </button>
              </>
            ) : (
              <button
                onClick={signIn}
                title="تسجيل الدخول"
                className="flex items-center justify-center gap-2 bg-blue-700 text-white shadow-sm hover:shadow-lg hover:shadow-blue-700/20 px-7 py-2.5 rounded-full font-medium transition-all duration-200 w-full sm:w-auto hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                <LogIn className="w-4 h-4 ml-1" />
                تسجيل الدخول
              </button>
            )}
          </div>
        </header>

        {/* Hero / CTA Section */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-12 bg-white shadow-sm border border-slate-100 p-6 sm:p-8 md:p-12 rounded-[24px] sm:rounded-[32px] relative overflow-hidden"
        >
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-50 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-2xl relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-right">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">اربح رصيداً مجانياً يومياً!</h2>
              <p className="text-slate-500 text-base md:text-lg mb-6 sm:mb-8 leading-relaxed">
                تخطَ الرابط المختصر لاختبار سرعتك واحصل على كود بقيمة <strong className="text-blue-600">1$</strong> مجاناً كل 24 ساعة.
              </p>
              
              <Link 
                href="/shortlink-demo" 
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 sm:py-4 rounded-2xl font-semibold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 text-base sm:text-lg w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                احصل على الكود الآن
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Claim Section */}
        {user && (
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12 md:mb-20 bg-slate-50 border border-slate-200 p-6 sm:p-8 md:p-10 rounded-[24px] sm:rounded-[32px]"
          >
            <div className="max-w-xl mx-auto md:mx-0 text-center md:text-right">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">هل لديك كود سري؟</h2>
              <p className="text-slate-500 text-sm md:text-base mb-6">
                أدخل الكود المكون من 8 رموز في الأسفل لاسترداد قيمة الكود وإضافته إلى رصيدك.
              </p>
              
              <form onSubmit={handleClaim} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-4">
                  <input
                    type="text"
                    placeholder="أدخل الكود (مثال: ABCD1234)"
                    className={`w-full bg-white border ${errorMsg ? 'border-red-400 focus:ring-red-500/10 focus:border-red-500' : 'border-slate-200 focus:ring-blue-600/10 focus:border-blue-600'} rounded-2xl px-5 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus-visible:ring-offset-1 transition-all font-mono text-center sm:text-right text-lg tracking-widest uppercase`}
                    value={code}
                    maxLength={8}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setErrorMsg("");
                    }}
                  />
                  <button
                    type="submit"
                    disabled={claiming || code.trim().length !== 8}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                  >
                    {claiming ? <div aria-busy="true"><Loader2 className="w-6 h-6 animate-spin" /></div> : "استرداد"}
                  </button>
                </div>
                {errorMsg && (
                  <motion.div aria-live="polite" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-600 bg-red-50 border border-red-100 p-3 sm:p-4 rounded-xl flex items-center gap-3 font-medium">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm md:text-base text-right">{errorMsg}</p>
                  </motion.div>
                )}
              </form>
            </div>
          </motion.section>
        )}

        {/* Store Section */}
        <StoreItems balance={balance} stockMap={stockMap} />

      </main>
    </div>
  );
}
