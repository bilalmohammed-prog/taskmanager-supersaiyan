"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { BarChart3, FolderKanban, Inbox, Users } from "lucide-react";
import ProfileMenu from "@/components/ProfileMenu";

const NAV_ITEMS = [
  { label: "Employees", href: "employees", icon: Users },
  { label: "Projects", href: "projects", icon: FolderKanban },
  { label: "Analytics", href: "analytics", icon: BarChart3 },
  { label: "Inbox", href: "inbox", icon: Inbox },
] as const;

export default function LeftSideBar() {
  const { orgId } = useParams<{ orgId: string }>();
  const pathname = usePathname();

  return (
    <aside className="hidden h-full w-[280px] shrink-0 flex-col justify-between border-r border-zinc-200 bg-white py-6 md:flex">
      <div className="space-y-8 px-6">
        <div className="text-lg font-semibold tracking-tight text-zinc-800">
          ResourceManager
        </div>

        <nav className="mt-8 space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const fullHref = `/organizations/${orgId}/${href}`;
            const isActive = pathname.startsWith(fullHref);

            return (
              <Link
                key={href}
                href={fullHref}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-100 text-zinc-900 shadow-sm ring-1 ring-zinc-200/50"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-zinc-100 px-6 pt-6">
        <ProfileMenu />
      </div>
    </aside>
  );
}
