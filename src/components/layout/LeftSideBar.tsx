"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import ProfileMenu from "@/components/ProfileMenu";

const NAV_ITEMS = [
  { label: "Employees", href: "employees", icon: "/icons/createEmp.svg" },
  { label: "Projects",  href: "projects",  icon: "/icons/tasks.svg"     },
  { label: "Analytics", href: "analytics", icon: "/icons/progress.svg"  },
  { label: "Inbox",     href: "inbox",     icon: "/icons/inbox.svg"     },
] as const;

export default function LeftSideBar() {
  const { orgId } = useParams<{ orgId: string }>();
  const pathname  = usePathname();

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "64px",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "12px",
        paddingBottom: "16px",
        backgroundColor: "var(--card)",
borderRight: "1px solid var(--border)",
boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
        zIndex: 999,
      }}
    >
      {/* Nav links */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          flex: 1,
          width: "100%",
          paddingTop: "52px", // clears the TopBar height
        }}
      >
        {NAV_ITEMS.map(({ label, href, icon }) => {
          const fullHref  = `/organizations/${orgId}/${href}`;
          const isActive  = pathname.startsWith(fullHref);

          return (
            <Link key={href} href={fullHref} style={{ width: "100%" }}>
              <Button
                variant="sidebar"
                style={{
                  width: "100%",
                  backgroundColor: isActive
                    ? "rgba(255,255,255,0.12)"
                    : "transparent",
                  borderRadius: "8px",
                }}
              >
                <Image
                  src={icon}
                  alt={label}
                  width={22}
                  height={22}
                  style={{ flexShrink: 0 }}
                />
                <span style={{ fontSize: "10px", color: "white" }}>
                  {label}
                </span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Profile menu pinned to bottom */}
      <ProfileMenu />
    </aside>
  );
}