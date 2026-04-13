"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const boardNav = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Leases", href: "/leases" },
  { name: "Properties", href: "/properties" },
  { name: "Screening", href: "/screening" },
  { name: "Reports", href: "/reports" },
  { name: "Notifications", href: "/notifications" },
];

const ownerNav = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "My Leases", href: "/leases" },
  { name: "Notifications", href: "/notifications" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isBoardMember } = useAuth();
  const nav = isBoardMember ? boardNav : ownerNav;

  return (
    <div className="flex flex-col w-60 bg-[#0a0f1e] text-white min-h-screen">
      <div className="px-5 py-6">
        <h1 className="text-lg font-semibold tracking-tight">Glenwood Park</h1>
        <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-widest">Lease Management</p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-md text-[13px] font-medium transition-all ${
                active
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
