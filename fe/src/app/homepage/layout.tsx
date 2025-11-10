"use client";

import { HomepageProvider } from "./HomepageProvider";

export default function HomepageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HomepageProvider>{children}</HomepageProvider>;
}
