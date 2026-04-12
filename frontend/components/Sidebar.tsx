"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const boardNav = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Leases", href: "/leases", icon: "📋" },
  { name: "Properties", href: "/properties", icon: "🏠" },
  { name: "Screening", href: "/screening", icon: "🔍" },
  { name: "Reports", href: "/reports", icon: "📈" },
  { name: "Notifications", href: "/notifications", icon: "🔔" },
];

const ownerNav = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "My Leases", href: "/leases", icon: "📋" },
  { name: "Notifications", href: "/notifications", icon: "🔔" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isBoardMember } = useAuth();
  const nav = isBoardMember ? boardNav : ownerNav;

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Zinc HOA</h1>
        <p className="text-sm text-gray-400 mt-1">Lease Management</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="text-sm">
          <p className="font-medium">{user?.first_name} {user?.last_name}</p>
          <p className="text-gray-400 capitalize">{user?.role?.replace("_", " ")}</p>
        </div>
        <button
          onClick={logout}
          className="mt-3 w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
