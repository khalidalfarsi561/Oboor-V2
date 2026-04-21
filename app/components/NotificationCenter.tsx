"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bell, Check, Trash2, Loader2, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserNotifications, markNotificationAsRead } from "../actions/notifications";
import { toast } from "sonner";

export function NotificationCenter({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const data = await getUserNotifications(userId);
    setNotifications(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      // Use IIFE to satisfy lint rule about setState in effect
      (async () => {
        await fetchNotifications();
      })();
      
      // Polling every 2 minutes for new notifications
      const interval = setInterval(fetchNotifications, 120000);
      return () => clearInterval(interval);
    }
  }, [userId, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRead = async (id: string) => {
    await markNotificationAsRead(userId, id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center relative hover:bg-slate-50 transition-all hover:-translate-y-0.5 shadow-sm"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? "+9" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 mt-3 w-80 sm:w-96 bg-white border border-slate-200 rounded-[24px] shadow-2xl z-50 overflow-hidden"
              dir="rtl"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800">التنبيهات</h3>
                {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center gap-2">
                    <Info className="w-8 h-8 text-slate-300" />
                    <p className="text-slate-400 text-sm">لا توجد تنبيهات حالياً.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className={`p-4 flex gap-4 transition-colors hover:bg-slate-50 relative ${!notif.read ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!notif.read ? 'bg-blue-600' : 'bg-slate-200'}`} />
                        <div className="flex-1">
                          <p className={`text-sm leading-relaxed ${!notif.read ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.createdAt).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        {!notif.read && (
                          <button 
                            onClick={() => handleRead(notif.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-100 transition-all"
                            title="تحديد كمقروء"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/30 text-center">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
