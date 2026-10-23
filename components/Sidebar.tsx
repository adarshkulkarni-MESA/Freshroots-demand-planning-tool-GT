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
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 leading-tight">Freshroots</div>
            <div className="text-xs text-slate-500">Demand Planner</div>
          </div>
        </div>
      </div>

      {/* Mandate banner */}
      <div className="mx-3 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="text-xs font-semibold text-amber-800">90-Day Mandate</div>
        <div className="text-xs text-amber-700 mt-0.5">Deepa's target: streamline Raghav's weekly planning cycle</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-teal-50 text-teal-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? "text-teal-600" : "text-slate-400"}`} />
              <span className="leading-tight">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200">
        <div className="text-xs text-slate-400">Rules v1.0.0 · Oct 2026</div>
        <div className="text-xs text-slate-400 mt-0.5">Maharashtra & Goa · 15 SKUs</div>
      </div>
    </aside>
  );
}
