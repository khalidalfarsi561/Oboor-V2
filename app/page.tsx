import React from "react";
import { getStoreStock } from "./actions/store";
import { HomeClient } from "./components/home/HomeClient";
import { adminDb } from "./lib/firebase/admin";

export default async function HomePage() {
  const stockMap = await getStoreStock();
  let layoutOrder = ["hero", "claim", "store"];
  
  try {
    const settingsSnap = await adminDb.collection("settings").doc("layout").get();
    if (settingsSnap.exists) {
      layoutOrder = settingsSnap.data()?.order || layoutOrder;
    }
  } catch(e) {}
  
  return <HomeClient stockMap={stockMap} layoutOrder={layoutOrder} />;
}
