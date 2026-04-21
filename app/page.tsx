import React from "react";
import { getStoreStock } from "./actions/store";
import { HomeClient } from "./components/home/HomeClient";
import { adminDb } from "./lib/firebase/admin";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const stockMap = await getStoreStock();
  let layoutOrder = ["hero", "claim", "store"];
  let design = {};
  
  try {
    const settingsSnap = await adminDb.collection("settings").doc("layout").get();
    if (settingsSnap.exists) {
      const data = settingsSnap.data();
      layoutOrder = data?.order || layoutOrder;
      design = data?.design || {};
    }
  } catch(e) {}
  
  return <HomeClient stockMap={stockMap} layoutOrder={layoutOrder} design={design} />;
}
