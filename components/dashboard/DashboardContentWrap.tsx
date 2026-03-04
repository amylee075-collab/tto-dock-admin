"use client";

import { useSidebar } from "@/contexts/SidebarContext";

export default function DashboardContentWrap({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`min-h-screen flex flex-col transition-[padding] duration-300 ${
        collapsed ? "md:pl-20" : "md:pl-64"
      }`}
    >
      {children}
    </div>
  );
}
