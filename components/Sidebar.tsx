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
    <aside className="w-64 shrink-0 bg-white border-r border-slate-100 flex flex-col min-h-screen">
      {/* Centered brand */}
      <div className="flex flex-col items-center px-5 pt-8 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-100 mb-3">
          <Leaf className="w-[22px] h-[22px] text-white" />
        </div>
        <div className="text-[15px] font-bold text-slate-900 tracking-tight">Freshroots</div>
        <div className="text-[11px] text-slate-400 tracking-widest font-semibold uppercase mt-0.5">Demand Planner</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 group ${
                active
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                active
                  ? "bg-emerald-100"
                  : "bg-slate-100 group-hover:bg-slate-200"
              }`}>
                <Icon className={`w-3.5 h-3.5 transition-colors ${
                  active ? "text-emerald-600" : "text-slate-500 group-hover:text-slate-700"
                }`} />
              </div>
              <span className="leading-tight truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          <span className="text-[11px] text-slate-400 font-medium">Live · Rules v1.0.0</span>
        </div>
        <div className="text-[11px] text-slate-400">Maharashtra & Goa · Oct 2026</div>
      </div>
    </aside>
  );
}
