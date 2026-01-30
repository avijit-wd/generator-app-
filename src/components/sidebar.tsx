"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/auth";

const navItems = [
  { href: "/image", label: "Image" },
  { href: "/video", label: "Video" },
  { href: "/audio", label: "Audio" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-gray-900 text-white px-4 py-3">
        <h1 className="text-lg font-bold">AI Generator</h1>
        <button onClick={() => setOpen(!open)} className="p-1">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {open ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="md:hidden bg-gray-900 text-white px-4 pb-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`px-3 py-2 rounded text-sm ${
                pathname === item.href
                  ? "bg-gray-700 font-medium"
                  : "hover:bg-gray-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => logout()}
            className="px-3 py-2 rounded text-sm text-left hover:bg-gray-800 text-red-400"
          >
            Logout
          </button>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 h-screen bg-gray-900 text-white flex-col p-4 shrink-0">
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
    </>
  );
}
