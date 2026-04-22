"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogIn, LogOut, Gift } from "lucide-react";
import Link from "next/link";
import { NotificationCenter } from "../NotificationCenter";
import { UserAvatar } from "../UserAvatar";
import { DesignPatch, mapDesignPatchToStyle } from "../../lib/design";

interface HomeHeaderProps {
  user: any;
  balance: number | null;
  signIn: () => void;
  signOut: () => void;
  design: Record<string, DesignPatch>;
}

export function HomeHeader({ user, balance, signIn, signOut, design }: HomeHeaderProps) {
  const getStyle = (id: string) => mapDesignPatchToStyle(design[id] || {});

  return (
    <header className="flex flex-row items-center justify-between mb-8 md:mb-16 group/nav" style={getStyle("nav")}>
      <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md border border-slate-200/50 pl-6 pr-4 py-2 rounded-2xl shadow-sm hover:shadow-md transition-all hover:bg-white hover:-translate-y-0.5" style={getStyle("brand")}>
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0" style={getStyle("icon_bg")}>
          <Gift className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap" style={getStyle("brand_text")}>
          متجر <span className="text-blue-600" style={getStyle("accent_text")}>المكافآت</span>
        </h1>
      </div>

      <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 w-full md:w-auto">
        {user ? (
          <>
            <div className="flex items-center gap-2">
              <UserAvatar src={user.photoURL} alt={user.displayName} />
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
  );
}
