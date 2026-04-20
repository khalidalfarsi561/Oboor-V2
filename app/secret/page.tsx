"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, runTransaction } from "firebase/firestore";
import { db } from "../lib/firebase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, LogIn, AlertCircle, Copy, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

function SecretContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const linkId = searchParams.get("linkId");
  const ref = searchParams.get("ref");
  
  const { user, loading, signIn } = useAuth();
  
  const [status, setStatus] = useState<"checking" | "allowed" | "denied" | "generated">("checking");
  const [errorMessage, setErrorMessage] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      return; // UI will show login button
    }

    if (!linkId) {
      setTimeout(() => {
        setStatus("denied");
        setErrorMessage("هذا الرابط غير صالح أو مفقود المعرّف.");
      }, 0);
      return;
    }

    // Basic referrer/ref security check to simulate "Only came from shortlink"
    if (ref !== "shortjambo") {
      setTimeout(() => {
        setStatus("denied");
        setErrorMessage("عذرا، لا يمكن الوصول لهذه الصفحة مباشرة. يجب استخدام الرابط الأساسي.");
      }, 0);
      return;
    }

    const checkAndGenerate = async () => {
      try {
        setStatus("checking");
        
        const claimId = `${user.uid}_${linkId}`;
        const claimRef = doc(db, "linkClaims", claimId);
        
        const claimSnap = await getDoc(claimRef);
        
        if (claimSnap.exists()) {
          const lastGen = claimSnap.data().lastGeneratedAt;
          if (lastGen) {
            const lastGenMs = lastGen.toMillis();
            const now = Date.now();
            const timeDiff = now - lastGenMs;
            
            if (timeDiff < 86400000) { // 24 hours in ms
              const hoursLeft = Math.ceil((86400000 - timeDiff) / (1000 * 60 * 60));
              throw new Error(`لقد قمت بتوليد كود من هذا الرابط بالفعل. يرجى الانتظار ${hoursLeft} ساعة.`);
            }
          }
        }

        setStatus("allowed");

      } catch (err: any) {
        setStatus("denied");
        setErrorMessage(err.message || "لا يمكن الوصول في الوقت الحالي.");
      }
    };

    checkAndGenerate();
  }, [user, loading, linkId, ref]);

  const generateCode = async () => {
    if (!user || !linkId || status !== "allowed") return;
    
    try {
      setStatus("checking");
      // Generate 8-char random alphanumeric code
      const result = await runTransaction(db, async (transaction) => {
        const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const codeRef = doc(db, "rewardCodes", randomCode);
        const codeSnap = await transaction.get(codeRef);
        
        if (codeSnap.exists()) {
          throw new Error("حدث تضارب، يرجى المحاولة مرة أخرى"); // Extremely rare
        }

        const claimId = `${user.uid}_${linkId}`;
        const claimRef = doc(db, "linkClaims", claimId);
        
        // This validates via the `existsAfter` rule atomically
        transaction.set(codeRef, {
          code: randomCode,
          amount: 1, // Strictly 1$ generated
          isUsed: false,
          generatedBy: user.uid,
          linkId: linkId,
          createdAt: serverTimestamp()
        });

        transaction.set(claimRef, {
          userId: user.uid,
          linkId: linkId,
          lastGeneratedAt: serverTimestamp()
        }, { merge: true });

        return randomCode;
      });

      setGeneratedCode(result);
      setStatus("generated");
    } catch(err: any) {
      setStatus("denied");
      setErrorMessage("حدث خطأ أثناء إصدار الكود، قد تكون استخدمت الحد الأقصى اليومي.");
      console.error(err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success("تم نسخ الكود بنجاح!");
    
    // Kick user to main page
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-6" />
        <p className="text-slate-500 font-medium">التحقق من الاتصال الآمن...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto relative z-10">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-slate-100 rounded-[32px] p-10 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <ShieldAlert className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">تسجيل الدخول مطلوب</h1>
            <p className="text-slate-500 mb-10 text-lg">
              لإكمال العملية وإنشاء الكود السري يجب أن تقوم تسجيل الدخول لحسابك لتجنب الاحتيال.
            </p>
            <button
              onClick={signIn}
              className="w-full flex justify-center items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all"
            >
              <LogIn className="w-5 h-5 ml-2" />
              سجل الدخول فوراً
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-[32px] p-10 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden"
          >
            {status === "checking" && (
              <div className="py-8">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-6" />
                <h1 className="text-xl font-bold text-slate-900 mb-2">جاري التحقق...</h1>
              </div>
            )}

            {status === "allowed" && (
              <div className="py-4">
                <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">نجاح التخطي!</h1>
                <p className="text-slate-500 mb-8">
                  أنت الآن مستعد لإنشاء الكود السري الخاص بك والذي يمنحك 1$ مجاناً!
                </p>
                <button
                  onClick={generateCode}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg"
                >
                  إنشاء الكود السري
                </button>
              </div>
            )}

            {status === "generated" && (
              <div className="py-4">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">تم إنشاء الكود بنجاح</h1>
                <p className="text-slate-500 mb-8">انسخ الكود ثم الصقه في الصفحة الرئيسية لاسترداد الرصيد.</p>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 mb-8 relative group">
                  <p className="text-4xl font-mono font-bold tracking-widest text-slate-900">{generatedCode}</p>
                </div>

                <button
                  onClick={handleCopy}
                  className={`${copied ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'} w-full flex justify-center items-center gap-2 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg transition-colors`}
                >
                  {copied ? <CheckCircle2 className="w-6 h-6 ml-2" /> : <Copy className="w-6 h-6 ml-2" />}
                  {copied ? "تم النسخ بنجاح! سيتم تحويلك..." : "نسخ الكود والعودة"}
                </button>
              </div>
            )}

            {status === "denied" && (
              <div className="py-4">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <AlertCircle className="w-10 h-10 text-red-500" strokeWidth={2.5} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-4">تم الرفض</h1>
                <p className="text-slate-600 font-medium text-lg leading-relaxed text-balance text-red-600 bg-red-50 p-4 rounded-xl mb-6">
                  {errorMessage}
                </p>

                {errorMessage.includes("ساعة") && (
                  <button 
                    onClick={async () => {
                      if (!user || !linkId) return;
                      await deleteDoc(doc(db, "linkClaims", `${user.uid}_${linkId}`));
                      window.location.reload();
                    }}
                    className="text-sm font-medium text-slate-400 hover:text-blue-600 transition-colors underline"
                  >
                    🛠️ مطور: إعادة تعيين قفل الـ 24 ساعة للتجربة
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SecretPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-100/30 blur-[120px] rounded-full pointer-events-none" />
      
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      }>
        <SecretContent />
      </Suspense>
    </div>
  );
}
