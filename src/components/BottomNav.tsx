"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Users, FileCheck2, Sparkles } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Voice & Claim",
      icon: Mic,
    },
    {
      href: "/participants",
      label: "Participants",
      icon: Users,
    },
    {
      href: "/history",
      label: "Audit & History",
      icon: FileCheck2,
    },
    {
      href: "/demo",
      label: "Interactive Demo",
      icon: Sparkles,
    },
  ];

  return (
    <nav
      aria-label="Primary Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 glass-nav"
    >
      <div className="mx-auto flex max-w-xl items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl py-2 text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "glass-pill-active text-teal-300"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-all ${isActive ? "drop-shadow-[0_0_8px_rgba(20,184,166,0.60)]" : ""}`}
              />
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
