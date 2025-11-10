"use client";

import styles from "./styles.module.css";
import { useHomepage } from "./HomepageProvider";
import SearchBar from "./_components/SearchBar";
import ActionButtons from "./_components/ActionButtons";
import Section from "./_components/Section";
import HomePager from "./_components/HomePager";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import SpecializationsBlock from "./_components/SpecializationsBlock";

const readInt = (sp: URLSearchParams, key: string, fb: number) => {
  const v = parseInt(sp.get(key) || "", 10);
  return Number.isFinite(v) && v > 0 ? v : fb;
};

export default function Homepage() {
  const { continueReading, topUpvoted, specGroups, loading, q } = useHomepage();
  const sp = useSearchParams();

  const defaultGroupsPerPage = 3;
  const pageFromUrl = readInt(new URLSearchParams(sp.toString()), "hpPage", 1);
  const groupsPerPage = readInt(
    new URLSearchParams(sp.toString()),
    "hpSpecSize",
    defaultGroupsPerPage,
  );

  const filteredGroups = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return specGroups;
    return specGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((d) => {
          const t = d.title?.toLowerCase() ?? "";
          const u = d.uploader?.toLowerCase() ?? "";
          const spz = d.specialization?.toLowerCase() ?? "";
          const org = (d as any).orgName?.toLowerCase?.() ?? "";
          const sub = d.subject?.toLowerCase() ?? "";
          const pts = (d as any).points?.toString?.().toLowerCase?.() ?? "";
          return (
            t.includes(s) ||
            u.includes(s) ||
            spz.includes(s) ||
            org.includes(s) ||
            sub.includes(s) ||
            pts.includes(s)
          );
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [q, specGroups]);

  const totalPages = useMemo(() => {
    const rest = Math.max(0, filteredGroups.length - groupsPerPage);
    const extraPages = Math.ceil(rest / groupsPerPage);
    return 1 + extraPages;
  }, [filteredGroups.length, groupsPerPage]);

  const currentPage = Math.min(pageFromUrl, totalPages);
  const visibleGroups = useMemo(() => {
    if (currentPage <= 1) return filteredGroups.slice(0, groupsPerPage);
    const start = groupsPerPage + (currentPage - 2) * groupsPerPage;
    return filteredGroups.slice(start, start + groupsPerPage);
  }, [filteredGroups, groupsPerPage, currentPage]);

  if (loading) {
    return (
      <main className={styles.main}>
        <div className="text-gray-500 dark:text-gray-400">
          Loading homepage...
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.topRow}>
        <SearchBar />
      </div>
      <ActionButtons />

      {currentPage === 1 && (
        <>
          <Section
            title="Continue Reading"
            items={continueReading}
            sectionKey="cr"
            defaultPageSize={8}
          />
          <Section
            title="Top Upvoted"
            items={topUpvoted}
            sectionKey="tu"
            defaultPageSize={8}
          />
        </>
      )}

      <SpecializationsBlock
        groups={visibleGroups}
        defaultGroupsPerPage={0}
        maxItemsPerGroup={8}
        disablePager
      />

      <HomePager
        totalPages={totalPages}
        defaultGroupsPerPage={defaultGroupsPerPage}
      />
    </main>
  );
}
