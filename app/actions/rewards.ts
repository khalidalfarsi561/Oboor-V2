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

export async function generateRewardCode(userId: string, linkId: string) {
  if (!userId || !linkId) throw new Error("Missing parameters");

  return await adminDb.runTransaction(async (transaction) => {
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

    return randomCode;
  });
}

export async function claimRewardCode(userId: string, codeStr: string) {
  if (!userId || !codeStr) throw new Error("Missing parameters");
  const parsedCode = codeStr.trim().toUpperCase();
  if (parsedCode.length !== 8) throw new Error("Invalid code");

  return await adminDb.runTransaction(async (transaction) => {
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
}
