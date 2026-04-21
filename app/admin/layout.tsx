"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { verifyServerAdmin } from "../actions/admin";
import { useRouter } from "next/navigation";
import { Loader2, ShieldX } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push("/");
      return;
    }

    const checkAdmin = async () => {
      const isOk = await verifyServerAdmin(user.uid, user.email || "");
      if (isOk) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user, loading, router]);

  if (loading || isAdmin === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 border-t-4 border-red-500">
        <Loader2 className="w-12 h-12 animate-spin text-red-500" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-slate-900 border-t-8 border-red-600 text-center p-6">
        <ShieldX className="w-24 h-24 text-red-500 mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">تم الحظر الكامل</h1>
        <p className="text-red-400 mb-8 max-w-md text-lg">هذه المنطقة مشفرة ومؤمنة بالكامل كخرسانة صلبة للمسؤول فقط. يرجى مغادرة الصفحة فوراً.</p>
        <Link href="/" className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all">العودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col items-center py-8">
        <div className="w-16 h-16 bg-gradient-to-tr from-red-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 mb-4">
          <span className="font-black text-2xl text-white">S^</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-widest mb-10">اللوحة الخارقة</h2>
        
        <nav className="w-full flex-1 px-4 flex flex-col gap-2">
          {children.props?.tabs}
          <Link href="/admin" className="px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-red-600/10 text-slate-300 hover:text-red-400 transition-colors">نظرة عامة</Link>
          <Link href="/admin/builder" className="px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-red-600/10 text-slate-300 hover:text-red-400 transition-colors">🌐 مهندس الواجهات المرئي</Link>
          <Link href="/admin/ai" className="px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-red-600/10 text-slate-300 hover:text-red-400 transition-colors">🧠 مساعد الذكاء الاصطناعي</Link>
        </nav>
        
        <div className="mt-auto px-4 w-full">
          <Link href="/" className="w-full block text-center px-4 py-3 bg-slate-800 rounded-xl text-sm font-medium hover:bg-slate-700 transition">خروج للموقع</Link>
        </div>
      </aside>

      {/* Main Content Content comes from children render */}
      <main className="flex-1 overflow-y-auto p-10">
        {children}
      </main>
    </div>
  );
}
