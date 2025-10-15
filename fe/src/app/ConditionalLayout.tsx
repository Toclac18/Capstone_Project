"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";

export default function ConditionalLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

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

      <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
        <Header />

        <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}


