"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { useSidebarContext } from "@/components/Layouts/sidebar/sidebar-context";

export default function ConditionalLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { isOpen, isMobile } = useSidebarContext();

  const isAuthRoute = pathname?.startsWith("/auth");

  if (isAuthRoute) {
    return (
      <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className={`flex-1 bg-gray-2 dark:bg-[#020d1a] transition-all duration-200 ${
        !isMobile && !isOpen ? 'ml-0' : ''
      }`}>
        <Header />

        <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}


