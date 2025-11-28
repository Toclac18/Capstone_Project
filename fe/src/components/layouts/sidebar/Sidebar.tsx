"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/utils/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  NAV_DATA,
  READER_NAV_DATA,
  REVIEWER_NAV_DATA,
  ORGANIZATION_ADMIN_NAV_DATA,
  BUSINESS_ADMIN_NAV_DATA,
} from "./data";
import { ArrowLeftIcon, ChevronUp } from "@/components/icons";
import { useSidebarContext } from "./SidebarContext";
import { useReader } from "@/hooks/useReader";
import type * as React from "react";
import { MenuItem } from "./MenuItem";

/* --------------------------- Types ------------------------------ */
export type NavLinkItem = {
  title: string;
  url: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  items?: never;
};
export type NavGroupItem = {
  title: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  items: Array<{ title: string; url: string }>;
};
export type NavSection = {
  label: string;
  items: Array<NavLinkItem | NavGroupItem>;
};
/* ------------------------- type guard ------------------------------ */
function isGroupItem(i: NavLinkItem | NavGroupItem): i is NavGroupItem {
  return Array.isArray((i as any).items);
}

/* --------------------------- Component ----------------------------- */
type Props = {
  sectionsOverride?: NavSection[];
  mergeStrategy?: "override" | "append" | "prepend";
};

export function Sidebar({
  sectionsOverride,
  mergeStrategy = "override",
}: Props) {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expanded, setExpanded] = useState<string[]>([]);
  const { role, loading } = useReader();

  // Get menu data based on role
  const defaultSections = useMemo<NavSection[]>(() => {
    if (loading) return [];
    
    switch (role) {
      case "READER":
        return READER_NAV_DATA as unknown as NavSection[];
      case "REVIEWER":
        return REVIEWER_NAV_DATA as unknown as NavSection[];
      case "ORGANIZATION_ADMIN":
        return ORGANIZATION_ADMIN_NAV_DATA as unknown as NavSection[];
      case "BUSINESS_ADMIN":
        return BUSINESS_ADMIN_NAV_DATA as unknown as NavSection[];
      default:
        return NAV_DATA as unknown as NavSection[];
    }
  }, [role, loading]);

  const sections = useMemo<NavSection[]>(() => {
    if (!sectionsOverride?.length) return defaultSections;
    if (mergeStrategy === "append")
      return [...defaultSections, ...sectionsOverride];
    if (mergeStrategy === "prepend")
      return [...sectionsOverride, ...defaultSections];
    return sectionsOverride;
  }, [defaultSections, sectionsOverride, mergeStrategy]);

  const toggle = useCallback((key: string) => {
    setExpanded((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  useEffect(() => {
    sections.forEach((sec) =>
      sec.items.forEach((it) => {
        if (
          isGroupItem(it) &&
          it.items.some((s) => s.url === pathname) &&
          !expanded.includes(it.title)
        ) {
          setExpanded((prev) => [...prev, it.title]);
        }
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, sections]);

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile
            ? "fixed bottom-0 top-0 z-50 max-w-[290px]"
            : "sticky top-0 h-screen",
          isMobile ? (isOpen ? "w-full" : "w-0") : isOpen ? "w-[290px]" : "w-0",
        )}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
          <div className="relative pr-4.5">
            <Link
              href="/"
              onClick={() => isMobile && toggleSidebar()}
              className="px-0 py-2.5 min-[850px]:py-0"
            >
              <Logo />
            </Link>
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">Close Menu</span>
                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10">
            {sections.map((section) => (
              <div key={section.label} className="mb-6">
                <h2 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                  {section.label}
                </h2>
                <nav aria-label={section.label}>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        {isGroupItem(item) ? (
                          <div>
                            <MenuItem
                              isActive={item.items.some(
                                (s) => s.url === pathname,
                              )}
                              onClick={() => toggle(item.title)}
                            >
                              {item.icon ? (
                                <item.icon className="size-6 shrink-0" />
                              ) : null}
                              <span>{item.title}</span>
                              <ChevronUp
                                className={cn(
                                  "ml-auto rotate-180 transition-transform duration-200",
                                  expanded.includes(item.title) && "rotate-0",
                                )}
                              />
                            </MenuItem>

                            {expanded.includes(item.title) && (
                              <ul className="ml-9 space-y-1.5 pb-[15px] pt-2">
                                {item.items.map((s) => (
                                  <li key={s.title}>
                                    <MenuItem
                                      as="link"
                                      href={s.url}
                                      isActive={pathname === s.url}
                                    >
                                      <span>{s.title}</span>
                                    </MenuItem>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <MenuItem
                            as="link"
                            href={item.url}
                            isActive={pathname === item.url}
                            className="py-3"
                          >
                            {item.icon ? (
                              <item.icon className="size-6 shrink-0" />
                            ) : null}
                            <span>{item.title}</span>
                          </MenuItem>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
