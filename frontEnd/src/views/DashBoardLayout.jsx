// src/views/acueil/generale/DashboardLayout.jsx
import { Outlet } from "react-router-dom";
import { useState } from "react";
import NavigationRail from "./Navigation";
import Header from "../components/composant/header";
import { useAppContext } from "./AppContext";

export default function DashboardLayout() {
  
  const {setDataServer, dataServer, profile} = useAppContext();

  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex">
      {/* Sidebar / Drawer */}
      <NavigationRail open={open} setOpen={setOpen} status={profile.statut}/>

      {/* Main area: add top padding to avoid header overlap, and left margin on md+ for sidebar */}
      <div className="flex-1 min-h-screen md:ml-64">
        {/* Header fixed */}
        <Header onOpen={setOpen} />

        {/* Content: padding-top = header height (h-16 => pt-16). Use p-6 for inner spacing */}
        <main className="pt-16 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
          <Outlet context={{dataServer, profile, setDataServer}}/>
        </main>
      </div>
    </div>
  );
}
