"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Upload, TrendingUp, PackageSearch,
  History, CheckSquare, ShoppingCart, Settings, Activity,
  Leaf,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/upload", label: "Data Upload & Health", icon: Upload },
  { href: "/recommendations", label: "Demand Recommendations", icon: TrendingUp },
  { href: "/explorer", label: "SKU Explorer", icon: PackageSearch },
  { href: "/runs", label: "Forecast Runs", icon: History },
  { href: "/review", label: "Human Review & Approvals", icon: CheckSquare },
  { href: "/procurement", label: "Procurement & PO", icon: ShoppingCart },
  { href: "/rules", label: "Rules & Config", icon: Settings },
  { href: "/audit", label: "Activity & Audit", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-slate-950 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/50 ring-1 ring-white/10">
            <Leaf className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <div className="font-bold text-[13px] text-white leading-tight tracking-tight">Freshroots</div>
            <div className="text-[11px] text-slate-500 tracking-wide">Demand Planner</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150 group relative ${
                active
                  ? "bg-emerald-500/10 text-emerald-400 font-medium"
                  : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-500 rounded-r-full" />
              )}
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  active ? "text-emerald-400" : "text-slate-600 group-hover:text-slate-400"
                }`}
              />
              <span className="leading-tight">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800/60">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span className="text-[11px] text-slate-600">Live · Rules v1.0.0</span>
        </div>
        <div className="text-[11px] text-slate-700">Maharashtra & Goa · Oct 2026</div>
      </div>
    </aside>
  );
}
