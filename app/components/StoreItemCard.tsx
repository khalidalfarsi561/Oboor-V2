import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Loader2, Bell, BellOff } from "lucide-react";
import { StoreItem } from "../lib/data";
import { toggleStockNotification, getSubscriptionStatus } from "../actions/store";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";

interface StoreItemCardProps {
  item: StoreItem;
  stock: number;
  purchasingId: number | null;
  onBuy: (item: StoreItem) => void;
  index: number;
}

export function StoreItemCard({ item, stock, purchasingId, onBuy, index }: StoreItemCardProps) {
  const { user, signIn } = useAuth();
  const isOutOfStock = stock <= 0;
  const isPurchasing = purchasingId === item.id;
  const isAnyPurchasing = purchasingId !== null;
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (user && isOutOfStock) {
      getSubscriptionStatus(user.uid, item.id).then(setIsSubscribed);
    }
  }, [user, item.id, isOutOfStock]);

  const handleToggleNotify = async () => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول لتفعيل التنبيهات.");
      signIn(); // assuming it's available or just prompt login
      return;
    }
    setIsToggling(true);
    try {
      const res = await toggleStockNotification(user.uid, item.id);
      setIsSubscribed(res.subscribed || false);
      if (res.subscribed) {
        toast.success("تم تفعيل التنبيه! سنخبرك فور توفره.");
      } else {
        toast.info("تم إلغاء التنبيه.");
      }
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ.");
    } finally {
      setIsToggling(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white border border-slate-100 p-8 rounded-[28px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden h-[360px] ui-reduced-motion"
      aria-busy={isPurchasing}
      aria-disabled={isOutOfStock}
    >
      <div className="absolute top-6 left-6" dir="ltr">
        {isOutOfStock ? (
          <span className="bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded-full border border-red-100">
            غير متوفر
          </span>
        ) : (
          <span className="bg-green-50 text-green-600 text-xs font-bold px-3 py-1 rounded-full border border-green-100">
            متوفر
          </span>
        )}
      </div>

      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-300">
        <Package className={`w-8 h-8 ${item.iconColor}`} />
      </div>
      
      <h3 className="font-bold text-xl text-slate-900 mb-2">{item.name}</h3>
      
      <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl mb-4" dir="ltr">
        <span>${item.price}</span>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <button 
          onClick={() => onBuy(item)}
          disabled={isAnyPurchasing || isOutOfStock}
          className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            isOutOfStock
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : isAnyPurchasing && !isPurchasing
              ? "bg-slate-900 text-white opacity-40 cursor-not-allowed"
              : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed"
          }`}
        >
          {isOutOfStock ? (
            "نفدت الكمية"
          ) : isPurchasing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "شراء الآن"
          )}
        </button>

        {isOutOfStock && (
          <button
            onClick={handleToggleNotify}
            disabled={isToggling}
            className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              isSubscribed 
                ? "text-blue-600 bg-blue-50 hover:bg-blue-100" 
                : "text-slate-600 bg-slate-50 hover:bg-slate-100"
            }`}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSubscribed ? (
              <>
                <BellOff className="w-4 h-4" />
                إلغاء التنبيه
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                أعلمني عند التوفر
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function StoreItemSkeleton() {
  return (
    <div className="bg-white border border-slate-100 p-8 rounded-[28px] shadow-sm flex flex-col items-start h-[340px]">
      <div className="w-full flex justify-end mb-2">
        <div className="w-16 h-6 rounded-full bg-slate-100 animate-pulse" />
      </div>
      <div className="w-16 h-16 rounded-2xl bg-slate-100 animate-pulse mb-6" />
      <div className="h-6 w-3/4 bg-slate-100 animate-pulse rounded-lg mb-4" />
      <div className="h-6 w-1/4 bg-slate-100 animate-pulse rounded-lg mb-8" />
      <div className="mt-auto w-full h-12 bg-slate-100 animate-pulse rounded-xl" />
    </div>
  );
}
