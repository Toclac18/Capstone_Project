"use client";

import {
  NavGroupItem,
  NavLinkItem,
  NavSection,
  Sidebar,
} from "@/components/Layouts/sidebar";
import { useHomepage } from "../HomepageProvider";
import * as Icons from "@/components/icons";

/**
 * Adapter dựng navDataOverride đúng kiểu NavSection[]
 * - Link item: { title, icon, url, items: [] }
 * - Group item: { title, icon, items: [{title,url}] }
 */
export default function HomepageSidebarAdapter() {
  const { orgs, savedLists, libraryDocs } = useHomepage();

  const homeLink: NavLinkItem = {
    title: "Home",
    url: "/homepage",
    icon: Icons.HomeIcon,
    items: [],
  };

  const organizationsGroup: NavGroupItem = {
    title: "Organizations",
    icon: Icons.FourCircle,
    items:
      orgs.length === 0
        ? []
        : orgs.map((o) => ({
            title: o.name,
            url: `/organizations/${o.slug ?? o.id}`,
          })),
  };

  const libraryLink: NavLinkItem = {
    title: "Library",
    url: "/library",
    icon: Icons.Table,
    items: [],
  };

  const savedListsGroup: NavGroupItem = {
    title: "Saved Lists",
    icon: Icons.Alphabet,
    items:
      savedLists.length === 0
        ? []
        : savedLists.map((s) => ({
            title: s.name,
            url: `/saved/${s.id}`,
          })),
  };

  const homepageSections: NavSection[] = [
    {
      label: "HOME",
      items: [homeLink],
    },
    {
      label: "ORGANIZATIONS",
      items: [organizationsGroup],
    },
    {
      label: "MY LIBRARY",
      items: [libraryLink, savedListsGroup],
    },
  ];

  return <Sidebar navDataOverride={homepageSections} />;
}
