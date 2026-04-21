"use server";

import { adminDb } from "../lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

function generateRandomCode(): string {
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .substring(0, 8)
    .toUpperCase();
}

export async function initiateClaimIntent(userId: string, linkId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId || !linkId) return { success: false, error: "Missing parameters" };

  try {
    const intentRef = adminDb.collection('userIntents').doc(`${userId}_${linkId}`);
    await intentRef.set({
      userId,
      linkId,
      startedAt: FieldValue.serverTimestamp(),
      status: 'pending'
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error initiating intent:", error);
    return { success: false, error: error.message };
  }
}

export async function generateRewardCode(userId: string, linkId: string): Promise<{ success: boolean; code?: string; error?: string }> {
  if (!userId || !linkId) return { success: false, error: "Missing parameters" };

  try {
    const generatedCode = await adminDb.runTransaction(async (transaction) => {
      // 1. Check intent BEFORE doing anything
      const intentRef = adminDb.collection("userIntents").doc(`${userId}_${linkId}`);
      const intentSnap = await transaction.get(intentRef);

      if (!intentSnap.exists) {
        throw new Error("عملية غير صالحة. يجب عليك النقر على زر التخطي من الصفحة الرئيسية أولاً.");
      }

      const intentData = intentSnap.data();
      if (intentData?.status !== 'pending') {
        throw new Error("عذراً، الرابط غير صالح حالياً أو تم استخدامه للتخطي مسبقاً. يرجى البدء من الزر في الصفحة الرئيسية.");
      }

      // Ads usually take time. To be very strictly mathematically sure they didn't just paste right away:
      const startedAtTime = intentData?.startedAt?.toMillis() || Date.now();
      const timeDiffSeconds = (Date.now() - startedAtTime) / 1000;
      
      // Assume at least 5 seconds are physically needed to click through the ad
      if (timeDiffSeconds < 5) {
        throw new Error("النظام رصد محاولة تجاوز للرابط المختصر! يجب عليك الانتظار والمرور بصفحات الإعلان بشكل طبيعي.");
      }

      const claimId = `${userId}_${linkId}`;
      const claimRef = adminDb.collection("linkClaims").doc(claimId);
      const claimSnap = await transaction.get(claimRef);

      if (claimSnap.exists) {
        const lastGen = claimSnap.data()?.lastGeneratedAt;
        if (lastGen) {
          const timeDiff = Date.now() - lastGen.toMillis();
          if (timeDiff < 86400000) {
            const hoursLeft = Math.ceil((86400000 - timeDiff) / (1000 * 60 * 60));
            throw new Error(`لقد قمت بتوليد كود من هذا الرابط بالفعل. يرجى الانتظار ${hoursLeft} ساعة.`);
          }
        }
      }

      const randomCode = generateRandomCode();
      const codeRef = adminDb.collection("rewardCodes").doc(randomCode);
      const codeSnap = await transaction.get(codeRef);

      if (codeSnap.exists) {
        throw new Error("حدث تضارب، يرجى المحاولة مرة أخرى");
      }

      transaction.set(codeRef, {
        code: randomCode,
        amount: 1,
        isUsed: false,
        generatedBy: userId,
        linkId: linkId,
        createdAt: FieldValue.serverTimestamp()
      });

      transaction.set(claimRef, {
        userId,
        linkId,
        lastGeneratedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      // Invalidate intent so it can't be reused for bypassed regeneration
      transaction.update(intentRef, {
        status: 'completed',
        completedAt: FieldValue.serverTimestamp()
      });

      return randomCode;
    });
    
    return { success: true, code: generatedCode };
  } catch (error: any) {
    console.error("Error in generateRewardCode:", error);
    return { success: false, error: error.message || "حدث خطأ غير متوقع" };
  }
}

export async function claimRewardCode(userId: string, codeStr: string): Promise<{ success: boolean; amount?: number; error?: string }> {
  if (!userId || !codeStr) return { success: false, error: "Missing parameters" };
  const parsedCode = codeStr.trim().toUpperCase();
  if (parsedCode.length !== 8) return { success: false, error: "Invalid code" };

  try {
    const amount = await adminDb.runTransaction(async (transaction) => {
      const codeRef = adminDb.collection("rewardCodes").doc(parsedCode);
      const codeSnap = await transaction.get(codeRef);

      if (!codeSnap.exists) {
        throw new Error("عذراً، هذا الكود غير صحيح أو لا يوجد.");
      }

      const codeData = codeSnap.data();
      if (codeData?.isUsed) {
        throw new Error("عذراً، تم استخدام هذا الكود مسبقاً، يرجى الحصول على كود جديد.");
      }

      const userRef = adminDb.collection("users").doc(userId);
      const userSnap = await transaction.get(userRef);

      let newBalance = codeData?.amount || 1;
      if (userSnap.exists) {
        newBalance += userSnap.data()?.balance || 0;
      } else {
         // Should be bootstrapped, but fallback just in case
         transaction.set(userRef, { uid: userId, balance: 0, createdAt: FieldValue.serverTimestamp() });
      }

      transaction.update(codeRef, {
        isUsed: true,
        usedBy: userId
      });

      transaction.update(userRef, {
        balance: newBalance
      });

      return codeData?.amount || 1;
    });

    return { success: true, amount };
  } catch (error: any) {
    console.error("Error in claimRewardCode:", error);
    return { success: false, error: error.message || "عذراً، حدث خطأ أثناء الاسترداد." };
  }
}
