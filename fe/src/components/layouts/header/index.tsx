"use client";

import { useSidebarContext } from "../sidebar/SidebarContext";
import { AnimatedMenuIcon } from "./icons";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import Link from "next/link";
import { Upload } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Logo } from "@/components/logo";
import { useReader } from "@/hooks/useReader";

export function Header() {
  const { toggleSidebar, isOpen } = useSidebarContext();
  const pathname = usePathname();
  const { role, loading, isAuthenticated } = useReader();

  // Check if user is guest (not authenticated)
  const isGuest = useMemo(() => {
    return !loading && !isAuthenticated;
  }, [loading, isAuthenticated]);

  // Show upload button only for READER role
  const showUploadButton = useMemo(() => {
    // Don't show on auth pages
    if (pathname?.startsWith("/auth")) return false;

    // Don't show if still loading
    if (loading) return false;

    // Only show for READER role
    return role === "READER" || role === "REVIEWER";
  }, [role, loading, pathname]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      <button
        onClick={toggleSidebar}
        className="group flex items-center justify-center rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <AnimatedMenuIcon
          isOpen={isOpen}
          className="text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white"
        />
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      {!isOpen && (
        <div className="ml-4 flex items-center max-xl:hidden">
          <Link href="/" className="flex h-8 items-center">
            <Logo />
          </Link>
        </div>
      )}

      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        {/* <div className="relative w-full max-w-[300px]">
          <input
            type="search"
            placeholder="Search"
            className="flex w-full items-center gap-3.5 rounded-full border bg-gray-2 py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 dark:focus-visible:border-primary"
          />

          <SearchIcon className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 max-[1015px]:size-5" />
        </div> */}

        {isGuest ? (
          <>
            {/* Guest: Only theme toggle and login button */}
            <ThemeToggleSwitch />
            <Link
              href="/auth/sign-in"
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-primary/90 hover:shadow-xl active:scale-100 dark:bg-primary dark:text-white dark:hover:bg-primary/90"
              title="Sign In"
            >
              <span>Sign In</span>
            </Link>
          </>
        ) : (
          <>
            {/* Authenticated: Upload button (for READER), Notification, UserInfo */}
            {showUploadButton && (
              <Link
                href="/reader/upload-document"
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-primary/90 hover:shadow-xl active:scale-100 dark:bg-primary dark:text-white dark:hover:bg-primary/90"
                title="Upload Document"
              >
                <Upload className="h-5 w-5" />
                <span>Upload</span>
              </Link>
            )}

            <ThemeToggleSwitch />

            <Notification />

            <div className="shrink-0">
              <UserInfo />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
