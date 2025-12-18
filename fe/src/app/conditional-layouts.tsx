"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { Header } from "@/components/layouts/header";
import { Sidebar } from "@/components/layouts/sidebar/Sidebar";
import { useSidebarContext } from "@/components/layouts/sidebar/SidebarContext";
import { Footer } from "@/components/layouts/footer/Footer";
import { useAuthContext } from "@/lib/auth/provider";

export default function ConditionalLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { isOpen, isMobile } = useSidebarContext();
  const { isAuthenticated } = useAuthContext();

  const isAuthRoute = pathname?.startsWith("/auth");

  // Guest users (not authenticated) - no sidebar, but show header and footer
  if (!isAuthenticated && !isAuthRoute) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-2 dark:bg-[#020d1a]">
        <Header />
        <main className="flex-1 mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  // Auth routes (sign-in, sign-up) - no sidebar
  if (isAuthRoute) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-2 dark:bg-[#020d1a]">
        <main className="flex-1 isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  // Authenticated users - full layout with sidebar
  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />

      <div
        className={`flex-1 min-w-0 bg-gray-2 transition-all duration-200 dark:bg-[#020d1a] ${
          !isMobile && isOpen ? "ml-[290px]" : ""
        } flex min-h-screen flex-col`}
      >
        <Header />

        <main className="flex-1 mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
