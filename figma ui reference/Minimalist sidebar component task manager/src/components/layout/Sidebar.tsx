import { NavLink } from "react-router";
import { Users, FolderKanban, BarChart3, Inbox } from "lucide-react";

export function Sidebar() {
  const navItems = [
    { label: "Employees", path: "/", icon: Users },
    { label: "Projects", path: "/projects", icon: FolderKanban },
    { label: "Analytics", path: "/analytics", icon: BarChart3 },
    { label: "Inbox", path: "/inbox", icon: Inbox },
  ];

  return (
    <aside className="w-[280px] bg-white border-r border-zinc-200 flex flex-col justify-between py-6 shrink-0 hidden md:flex h-full">
      <div className="px-6 space-y-8">
        {/* Logo/Brand Area (Optional for context) */}
        <div className="font-semibold text-lg tracking-tight text-zinc-800">
          ResourceManager
        </div>

        <nav className="space-y-1 mt-8">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 shadow-sm ring-1 ring-zinc-200/50"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="px-6 mt-auto border-t border-zinc-100 pt-6">
        {/* User Profile Footer */}
        <div className="flex items-center gap-3 group cursor-pointer p-2 rounded-lg hover:bg-zinc-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-sm font-semibold text-zinc-700 shadow-sm">
            B
          </div>
          <div className="flex flex-col text-sm truncate">
            <span className="font-medium text-zinc-900">Bilal Mohammed</span>
            <span className="text-zinc-500 text-xs truncate">Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
