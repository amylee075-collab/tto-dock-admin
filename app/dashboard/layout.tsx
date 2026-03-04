import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardContentWrap from "@/components/dashboard/DashboardContentWrap";
import { SidebarProvider } from "@/contexts/SidebarContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <DashboardContentWrap>
        <DashboardHeader />
        <main className="flex-1 overflow-auto">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-8">
            {children}
          </div>
        </main>
      </DashboardContentWrap>
    </SidebarProvider>
  );
}
