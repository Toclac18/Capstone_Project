"use client";

import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <SidebarProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
