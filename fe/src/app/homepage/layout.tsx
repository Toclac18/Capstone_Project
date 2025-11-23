"use client";

import { HomepageProvider } from "./provider";

export default function HomepageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HomepageProvider>{children}</HomepageProvider>;
}
