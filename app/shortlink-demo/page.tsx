import React from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { ShortlinkCountdown } from "../components/shortlink/ShortlinkCountdown";

export default function ShortlinkDemoPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
      <div className="bg-white p-6 sm:p-10 rounded-[24px] sm:rounded-[32px] shadow-xl max-w-md w-full border border-slate-200 ui-reduced-motion">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ExternalLink className="w-8 h-8 text-slate-500" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">محاكاة تخطي الإعلان</h1>
        <p className="text-slate-500 text-sm sm:text-base mb-8 px-2">
          هذه الصفحة تحاكي تجربة المستخدم في موقع مثل ShortJambo.
        </p>

        <ShortlinkCountdown />
      </div>
    </div>
  );
}
