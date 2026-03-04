"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardHeader() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 md:pl-6 md:pr-6">
      <div className="flex-1 min-w-0" />
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 hidden sm:inline">관리자</span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-orange-50 hover:text-[#ff5700] transition-colors"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
