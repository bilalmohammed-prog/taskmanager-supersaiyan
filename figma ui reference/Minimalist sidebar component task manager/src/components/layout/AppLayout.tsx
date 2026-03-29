import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { SupportWidget } from "../ui/SupportWidget";

export function AppLayout() {
  return (
    <div className="flex h-screen w-full bg-zinc-50 text-zinc-900 font-sans overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <TopBar />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto px-6 py-12 lg:px-12 relative">
          <Outlet />
        </main>
      </div>

      <SupportWidget />
    </div>
  );
}
