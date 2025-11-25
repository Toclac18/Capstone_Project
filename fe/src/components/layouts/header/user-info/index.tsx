"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/utils/utils";
import Link from "next/link";
import { useState, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/services/authService";
import { LogOutIcon, SettingsIcon, UserIcon } from "./icons";

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") {
      return {
        name: "",
        email: "",
        role: "",
      };
    }
    const userRole = localStorage.getItem("userRole") || "";
    const userEmail = localStorage.getItem("userEmail") || "";
    const userName = localStorage.getItem("userName") || "";

    return {
      name: userName || "User",
      email: userEmail || "",
      role: userRole,
    };
  });

  useLayoutEffect(() => {
    const updateUser = () => {
      const userRole = localStorage.getItem("userRole") || "";
      const userEmail = localStorage.getItem("userEmail") || "";
      const userName = localStorage.getItem("userName") || "";

      setUser({
        name: userName || "User",
        email: userEmail || "",
        role: userRole,
      });
    };
    window.addEventListener("storage", updateUser);

    queueMicrotask(() => {
      updateUser();
    });

    return () => {
      window.removeEventListener("storage", updateUser);
    };
  }, []);
  
  async function handleLogout() {
    try {
      await logout();
      setIsOpen(false);
      router.push('/auth/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if API fails
      setIsOpen(false);
      router.push('/auth/sign-in');
    }
  }

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">My Account</span>

        <figure className="flex items-center gap-3">
          <UserIcon />
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            <span>{user.name || 'User'}</span>

            <ChevronUpIcon
              aria-hidden
              className={cn(
                "rotate-180 transition-transform",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        <h2 className="sr-only">User information</h2>

        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          <UserIcon />
          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:text-white">
              {user.name || 'User'}
            </div>

            <div className="leading-none text-gray-6">{user.email || 'No email'}</div>
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer">
          <Link
            href={"/profile"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <UserIcon />

            <span className="mr-auto text-base font-medium">View profile</span>
          </Link>

          <Link
            href={"/pages/settings"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <SettingsIcon />

            <span className="mr-auto text-base font-medium">
              Account Settings
            </span>
          </Link>
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
            onClick={handleLogout}
          >
            <LogOutIcon />

            <span className="text-base font-medium">Log out</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}