"use client";

import { setupMocks } from "@/mock/indexMock";
setupMocks();
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/ui/toast";
import { SidebarProvider } from "@/components/layouts/sidebar/sidebar-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <SidebarProvider>
        <ToastProvider>{children}</ToastProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
