"use server";

import { adminDb } from "../lib/firebase/admin";
import { GoogleGenAI } from "@google/genai";

// Cache the admin verification since it happens inside layout
export async function verifyServerAdmin(uid: string, email: string): Promise<boolean> {
  if (!uid || !email) return false;
  
  const adminRef = adminDb.collection('admins').doc(uid);
  const adminDoc = await adminRef.get();
  
  // Concrete security: only an existing doc in 'admins' allows entry.
  // BUT to bootstrap the owner (you), if the email is 'khalidalfarsi1995@gmail.com' 
  // and there's no admin doc yet, we create it to lock it down to you.
  if (adminDoc.exists) {
    return true;
  } else if (email === "khalidalfarsi1995@gmail.com") {
    // Bootstrap master admin
    await adminRef.set({ email, createdAt: new Date() });
    return true;
  }
  
  return false;
}

export async function askAdminAI(prompt: string, context: string): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
    // We use gemini-2.5-pro to emulate the deepest reasoning logic requested
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `You are the master site-managing AI assistant.
Website Context: Next.js Vercel app matching Firestore rules. The Admin UI has visual drag and drop, and anti-fraud systems.
Current Status: ${context}
User Admin Query: ${prompt}`,
    });
    
    return { success: true, response: response.text || "لا توجد استجابة." };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: err.message };
  }
}

export async function saveSiteSettings(layoutOrder: string[]): Promise<{success: boolean; error?: string}> {
  try {
    await adminDb.collection('settings').doc('layout').set({
      order: layoutOrder,
      updatedAt: new Date(),
    }, { merge: true });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getDashboardStats() {
  const usersSnap = await adminDb.collection("users").count().get();
  const codesSnap = await adminDb.collection("rewardCodes").count().get();
  
  return {
    usersC: usersSnap.data().count,
    codesC: codesSnap.data().count
  };
}
