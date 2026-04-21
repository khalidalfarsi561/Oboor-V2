"use server";

import { adminDb } from "../lib/firebase/admin";

export async function getFullSiteSettings() {
  try {
    const settingsSnap = await adminDb.collection("settings").doc("layout").get();
    if (settingsSnap.exists) {
      const data = settingsSnap.data();
      return {
        order: data?.order || ["hero", "claim", "store"],
        design: data?.design || {}
      };
    }
  } catch(e) {}
  return { order: ["hero", "claim", "store"], design: {} };
}
