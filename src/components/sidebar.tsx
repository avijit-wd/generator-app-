"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth";

const navItems = [
  { href: "/image", label: "Image" },
  { href: "/video", label: "Video" },
  { href: "/audio", label: "Audio" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 h-screen bg-gray-900 text-white flex flex-col p-4 shrink-0">
      <h1 className="text-lg font-bold mb-6 px-2">AI Generator</h1>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded text-sm ${
              pathname === item.href
                ? "bg-gray-700 font-medium"
                : "hover:bg-gray-800"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={() => logout()}
        className="px-3 py-2 rounded text-sm text-left hover:bg-gray-800 text-red-400"
      >
        Logout
      </button>
    </aside>
  );
}
