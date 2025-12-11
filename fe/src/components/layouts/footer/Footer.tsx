"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="mt-16 w-full bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-10 px-6 py-12 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-4 max-w-sm">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Empowering learners with high-quality study resources, trusted reviewers,
            and a vibrant community.
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
              Product
            </h3>
            <Link href="/homepage" className="text-sm text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white">
              Documents
            </Link>
            <Link href="" className="text-sm text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white">
              Reviewers
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
              Company
            </h3>
            <Link href="/about" className="text-sm text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white">
              About
            </Link>
            <Link href="/contact-admin" className="text-sm text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white">
              Contact Admin
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
              Support
            </h3>
            <Link href="/terms" className="text-sm text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-gray-600 dark:text-gray-300 sm:flex-row">
          <span>© {new Date().getFullYear()} Readee. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

