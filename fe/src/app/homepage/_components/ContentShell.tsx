// src/app/_components/ContentShell.tsx
"use client";

import { useSidebarContext } from "@/components/Layouts/sidebar/sidebar-context";
import { cn } from "@/utils/utils";

export default function ContentShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isOpen, isMobile } = useSidebarContext();

  // chuẩn hoá kích thước
  const SIDEBAR_W = 290; // đúng với Sidebar
  const SIDEBAR_GAP = 24; // khoảng cách giữa sidebar ↔ content
  const OUTER_GUTTER = 24; // lề hai bên của trang

  const isDesktop = !isMobile;

  // margin-left: chỉ chừa khi sidebar mở trên desktop
  const mlClass =
    isDesktop && isOpen
      ? "lg:ml-[calc(var(--sidebar-w)+var(--sidebar-gap))]"
      : "ml-0";

  // max-width: không để content vượt lề phải
  //   - mở:  min(1400px, 100vw - sidebar - gap - outer gutter*2)
  //   - đóng: min(1500px, 100vw - outer gutter*2)
  const maxWOpen = `min(1400px, calc(100vw - var(--sidebar-w) - var(--sidebar-gap) - ${OUTER_GUTTER * 2}px))`;
  const maxWClose = `min(1500px, calc(100vw - ${OUTER_GUTTER * 2}px))`;

  return (
    <div
      className={cn("relative w-full", mlClass)}
      style={
        isDesktop && isOpen
          ? ({
              ["--sidebar-w" as any]: `${SIDEBAR_W}px`,
              ["--sidebar-gap" as any]: `${SIDEBAR_GAP}px`,
            } as React.CSSProperties)
          : ({
              ["--sidebar-w" as any]: "0px",
              ["--sidebar-gap" as any]: "0px",
            } as React.CSSProperties)
      }
    >
      <div
        className={cn(
          // padding ngoài — có thể giữ theo hệ thống của bạn
          "mx-auto w-full px-4 transition-[max-width,margin] duration-200 ease-linear md:px-6 lg:px-8",
          className,
        )}
        style={{
          maxWidth: isDesktop && isOpen ? maxWOpen : maxWClose,
        }}
      >
        {children}
      </div>
    </div>
  );
}
