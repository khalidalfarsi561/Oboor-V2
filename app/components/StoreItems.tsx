"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Music, Film, MessageSquare, Gamepad2, Loader2, CheckCircle2 } from "lucide-react";
import { doc, collection, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase/client";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";

export const ITEMS = [
  { id: 1, name: "كاب كات برو لمدة 7 أيام", price: 2, icon: <div title="منتج"><Package className="w-8 h-8 text-blue-500" /></div> },
  { id: 2, name: "سبوتيفاي بريميوم 1 شهر", price: 5, icon: <div title="منتج"><Music className="w-8 h-8 text-green-500" /></div> },
  { id: 3, name: "نتفلكس اللامحدود 1 شهر", price: 8, icon: <div title="منتج"><Film className="w-8 h-8 text-red-500" /></div> },
  { id: 4, name: "ديسكورد نايترو 1 شهر", price: 10, icon: <div title="منتج"><MessageSquare className="w-8 h-8 text-indigo-500" /></div> },
  { id: 5, name: "بطاقة ستيم بقيمة 20$", price: 20, icon: <div title="منتج"><Gamepad2 className="w-8 h-8 text-slate-700" /></div> },
];

export function StoreItems({ balance }: { balance: number | null }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);

  useEffect(() => {
    // Simulate fetching items to show the skeleton loader requested
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleBuy = async (item: typeof ITEMS[0]) => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً لتتمكن من الشراء.");
      return;
    }
    if (balance === null || balance < item.price) {
      toast.error("عذراً، رصيدك غير كافٍ لإتمام عملية الشراء.", {
        icon: <div className="text-red-500 font-bold">X</div>
      });
      return;
    }

    setPurchasingId(item.id);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) throw new Error("المستخدم غير موجود.");
        const currentBalance = userSnap.data().balance || 0;
        
        if (currentBalance < item.price) {
          throw new Error("رصيد غير كافٍ.");
        }

        const newPurchaseRef = doc(collection(db, "purchases"));
        transaction.set(newPurchaseRef, {
          userId: user.uid,
          itemId: item.id,
          itemName: item.name,
          price: item.price,
          createdAt: serverTimestamp()
        });

        transaction.update(userRef, {
          balance: currentBalance - item.price
        });
      });

      toast.success(`مبروك! تم شراء "${item.name}" بنجاح.`, {
        icon: <CheckCircle2 className="text-green-500 w-5 h-5" />
      });
    } catch (err: any) {
      console.error("Purchase error:", err);
      toast.error(err.message || "حدث خطأ غير متوقع أثناء الشراء.");
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">المنتجات المتوفرة</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {loading ? (
            // Skeleton Loaders
            Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-slate-100 p-8 rounded-[28px] shadow-sm flex flex-col items-start"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-100 animate-pulse mb-6" />
                <div className="h-6 w-3/4 bg-slate-100 animate-pulse rounded-lg mb-4" />
                <div className="h-6 w-1/4 bg-slate-100 animate-pulse rounded-lg mb-8" />
                <div className="mt-auto w-full h-12 bg-slate-100 animate-pulse rounded-xl" />
              </motion.div>
            ))
          ) : (
            ITEMS.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-slate-100 p-8 rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-300">
                  {item.icon}
                </div>
                
                <h3 className="font-bold text-xl text-slate-900 mb-2">{item.name}</h3>
                
                <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl mb-8" dir="ltr">
                  <span>${item.price}</span>
                </div>

                <div className="mt-auto">
                  <button 
                    onClick={() => handleBuy(item)}
                    disabled={purchasingId === item.id || purchasingId !== null}
                    className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {purchasingId === item.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "شراء الآن"
                    )}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
