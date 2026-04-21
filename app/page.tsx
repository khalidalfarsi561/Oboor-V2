"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "./components/AuthProvider";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "./lib/firebase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogIn, LogOut, Gift, Loader2, History, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Link from "next/link";
import { StoreItems } from "./components/StoreItems";

export default function HomePage() {
  const { user, loading, signIn, signOut } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBalance(null);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setBalance(docSnap.data().balance || 0);
      }
    }, (err) => {
      console.error("Error fetching balance snapshot:", err);
    });

    return () => unsubscribe();
  }, [user]);

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
      const result = await runTransaction(db, async (transaction) => {
        const codeRef = doc(db, "rewardCodes", code.trim().toUpperCase());
        const codeSnap = await transaction.get(codeRef);

        if (!codeSnap.exists()) {
          throw new Error("عذراً، هذا الكود غير صحيح أو لا يوجد.");
        }

        const codeData = codeSnap.data();
        if (codeData.isUsed) {
          throw new Error("عذراً، تم استخدام هذا الكود مسبقاً، يرجى الحصول على كود جديد.");
        }

        // Apply
        const userRef = doc(db, "users", user.uid);
        const userSnap = await transaction.get(userRef);
        
        let newBalance = codeData.amount || 1;
        if (userSnap.exists()) {
          newBalance += userSnap.data().balance || 0;
        }

        transaction.update(codeRef, {
          isUsed: true,
          usedBy: user.uid
        });

        transaction.update(userRef, {
          balance: newBalance
        });

        return codeData.amount;
      });

      // No manual setBalance here, the onSnapshot listener will update it automatically!
      toast.success(`تم بنجاح! تمت إضافة ${result}$ إلى رصيدك.`, {
        icon: <CheckCircle2 className="text-green-500 w-5 h-5" />
      });
      setCode("");
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#2563eb", "#4f46e5", "#38bdf8"] // Deep blue & indigo colors
      });

    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div title="جاري التحميل"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 relative">
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-50 to-transparent pointer-events-none" />
      
      <main className="max-w-5xl mx-auto px-6 py-10 relative z-10">
        
        {/* Navbar */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-10 md:mb-20 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              متجر <span className="text-blue-600">المكافآت</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 bg-white shadow-sm border border-slate-200 px-5 py-2.5 rounded-full" dir="ltr" title="الرصيد/المحفظة">
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
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4 ml-1" />
                  تسجيل خروج
                </button>
              </>
            ) : (
              <button
                onClick={signIn}
                title="تسجيل الدخول"
                className="flex items-center gap-2 bg-blue-700 text-white shadow-sm hover:shadow-lg hover:shadow-blue-700/20 px-7 py-2.5 rounded-full font-medium hover:-translate-y-0.5 transition-all duration-200"
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
          className="mb-12 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 md:p-12 rounded-[32px] relative overflow-hidden"
        >
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-50 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-2xl relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">اربح رصيداً مجانياً يومياً!</h2>
              <p className="text-slate-500 text-base md:text-lg mb-6 leading-relaxed">
                تخطَ الرابط المختصر لاختبار سرعتك واحصل على كود بقيمة <strong className="text-blue-600">1$</strong> مجاناً كل 24 ساعة.
              </p>
              
              <Link 
                href="/shortlink-demo" 
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-semibold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 text-lg"
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
            className="mb-20 bg-slate-50 border border-slate-200 p-8 md:p-10 rounded-[32px]"
          >
            <div className="max-w-xl">
              <h2 className="text-xl font-bold text-slate-900 mb-3">هل لديك كود سري؟</h2>
              <p className="text-slate-500 text-sm md:text-base mb-6">
                أدخل الكود المكون من 8 رموز في الأسفل لاسترداد قيمة الكود وإضافته إلى رصيدك.
              </p>
              
              <form onSubmit={handleClaim} className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="أدخل الكود هنا (مثال: ABCD1234)"
                    className={`flex-1 bg-white border ${errorMsg ? 'border-red-400 focus:ring-red-500/10 focus:border-red-500' : 'border-slate-200 focus:ring-blue-600/10 focus:border-blue-600'} rounded-2xl px-5 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all font-mono text-center text-lg tracking-widest uppercase`}
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
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg sm:w-auto"
                  >
                    {claiming ? <div title="جاري التحميل"><Loader2 className="w-6 h-6 animate-spin" /></div> : "استرداد"}
                  </button>
                </div>
                {errorMsg && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-600 bg-red-50/50 border border-red-100 p-4 rounded-xl flex items-center gap-3 font-medium">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm md:text-base">{errorMsg}</p>
                  </motion.div>
                )}
              </form>
            </div>
          </motion.section>
        )}

        {/* Store Section */}
        <StoreItems balance={balance} />

      </main>
    </div>
  );
}
