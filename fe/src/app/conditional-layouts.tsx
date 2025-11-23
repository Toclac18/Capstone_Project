"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { Header } from "@/components/layouts/header";
import { Sidebar } from "@/components/layouts/sidebar/Sidebar";
import { useSidebarContext } from "@/components/layouts/sidebar/SidebarContext";

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

      <div
        className={`flex-1 bg-gray-2 transition-all duration-200 dark:bg-[#020d1a] ${
          !isMobile && !isOpen ? "ml-0" : ""
        }`}
      >
        <Header />

        <main className="mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
