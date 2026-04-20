"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ExternalLink } from "lucide-react";

export default function ShortlinkDemoPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Simulate successful shortlink skip redirecting to Secret Page
      router.push("/secret?linkId=daily_link_1&ref=shortjambo");
    }
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-10 rounded-[32px] shadow-xl max-w-md w-full border border-slate-200"
      >
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ExternalLink className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">محاكاة تخطي الإعلان</h1>
        <p className="text-slate-500 mb-8">
          هذه الصفحة تحاكي تجربة المستخدم في موقع مثل ShortJambo.
        </p>

        <div className="bg-blue-50 text-blue-700 font-bold text-4xl py-6 rounded-2xl mb-4">
          {countdown}
        </div>
        <p className="text-sm font-medium text-slate-400">
          جاري التوجيه التلقائي إلى الصفحة السرية...
        </p>
      </motion.div>
    </div>
  );
}
