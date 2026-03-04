"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";

const ORANGE = "#ff5700";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: "📊" },
  { href: "/dashboard/contents", label: "콘텐츠 관리", icon: "📖" },
  { href: "/dashboard/today-words", label: "오늘의 단어", icon: "📝" },
  { href: "/dashboard/core-word-quiz", label: "문해력 기초 훈련", icon: "✏️" },
  { href: "/dashboard/learners", label: "학습자 데이터", icon: "👥" },
] as const;

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`hidden md:flex md:flex-col md:items-center md:justify-start md:h-full md:fixed md:inset-y-0 md:left-0 md:shrink-0 md:border-r md:border-gray-100 md:bg-white md:z-30 transition-[width] duration-300 ease-in-out ${
        collapsed ? "md:w-20" : "md:w-64 md:items-stretch"
      }`}
      role="navigation"
      aria-label="관리자 메뉴"
    >
      <div
        className={`shrink-0 flex flex-row items-center w-full border-b border-gray-100 min-h-14 h-14 relative ${
          collapsed ? "px-0" : "px-4"
        }`}
      >
        <div className={`flex flex-row items-center w-full h-full shrink-0 ${collapsed ? "justify-center" : "justify-start gap-4"}`}>
          <button
            type="button"
            onClick={toggle}
            className="flex items-center justify-center w-6 h-6 rounded-lg hover:bg-orange-50 transition-colors shrink-0"
            style={{ color: ORANGE }}
            aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          >
            <MenuIcon className="w-6 h-6 shrink-0" />
          </button>
          <Link
            href="/dashboard"
            className={`font-extrabold text-xl tracking-tight whitespace-nowrap shrink-0 ${
              collapsed ? "absolute left-0 top-0 opacity-0 pointer-events-none w-0 h-0 overflow-hidden" : "min-w-0"
            }`}
            style={{ color: ORANGE }}
            aria-label="또독 관리자"
          >
            또독 관리자
          </Link>
        </div>
      </div>
      <nav className={`w-full overflow-hidden shrink-0 ${collapsed ? "flex flex-col items-center" : "flex-1 pt-0 px-3"}`}>
        <ul className={`flex flex-col gap-1 justify-start w-full ${collapsed ? "items-center" : ""}`}>
          {navItems.map(({ href, label, icon }) => {
            const active = isActive(href);
            return (
              <li key={href} className={`flex h-12 items-center w-full ${collapsed ? "justify-center" : ""}`}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={`flex items-center h-12 rounded-xl text-lg font-semibold transition-colors ${
                    collapsed ? "justify-center w-10 h-10 rounded-full shrink-0" : "gap-4 px-4 w-full min-w-0"
                  } ${
                    active
                      ? "bg-orange-50 text-[#ff5700]"
                      : "text-gray-600 hover:bg-orange-50/70 hover:text-[#ff5700]"
                  }`}
                >
                  <span className="flex items-center justify-center w-6 h-6 shrink-0 text-xl leading-none" aria-hidden>
                    {icon}
                  </span>
                  {!collapsed && (
                    <span className="flex-1 min-w-0 whitespace-nowrap overflow-hidden">{label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
