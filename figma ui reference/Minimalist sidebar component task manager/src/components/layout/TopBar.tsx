import { Button } from "../ui/Button";
import { UserPlus } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-10 w-full h-16 bg-white border-b border-zinc-200/80 px-8 flex items-center justify-between shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] shrink-0">
      {/* Mobile Menu Trigger (Hidden on Desktop) */}
      <button className="md:hidden p-2 text-zinc-600 hover:bg-zinc-100 rounded-md">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Centered CTA Action */}
      <div className="flex-1 flex justify-center">
        <Button size="default" variant="primary" className="shadow-sm">
          <UserPlus className="w-4 h-4 mr-2 opacity-80" strokeWidth={2.5} />
          Invite Employee
        </Button>
      </div>
      
      {/* Right side spacer for centering */}
      <div className="w-10"></div>
    </header>
  );
}
