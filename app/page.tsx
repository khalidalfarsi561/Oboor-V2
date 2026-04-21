import React from "react";
import { getStoreStock } from "./actions/store";
import { HomeClient } from "./components/home/HomeClient";

export default async function HomePage() {
  const stockMap = await getStoreStock();
  
  return <HomeClient stockMap={stockMap} />;
}
