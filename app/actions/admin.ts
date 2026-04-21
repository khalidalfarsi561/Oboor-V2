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

export async function saveSiteSettings(layoutOrder: string[], designSpecs?: any): Promise<{success: boolean; error?: string}> {
  try {
    const data: any = {
      order: layoutOrder,
      updatedAt: new Date(),
    };
    if (designSpecs) {
      data.design = designSpecs;
    }
    await adminDb.collection('settings').doc('layout').set(data, { merge: true });
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

export async function updateItemStock(itemId: number, newStock: number) {
  try {
    const stockDocs = await adminDb.collection("storeItems").where("itemId", "==", itemId).get();
    if (stockDocs.empty) {
      await adminDb.collection("storeItems").add({ itemId, stock: newStock });
    } else {
      await stockDocs.docs[0].ref.update({ stock: newStock });
    }

    // If stock became positive, "notify" users
    if (newStock > 0) {
      const subscriptions = await adminDb.collection("stockNotifications").where("itemId", "==", itemId).get();
      
      const batch = adminDb.batch();
      subscriptions.docs.forEach(doc => {
        const userId = doc.data().userId;
        const msgRef = adminDb.collection("userNotifications").doc();
        batch.set(msgRef, {
          userId,
          message: `المنتج الذي كنت تنتظره متوفر الآن!`,
          type: "stock_update",
          createdAt: new Date(),
          read: false
        });
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
