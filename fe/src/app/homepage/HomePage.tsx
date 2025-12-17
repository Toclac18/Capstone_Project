"use client";

import styles from "./styles.module.css";
import { useHomepage } from "./provider";

import SearchBar from "./_components/SearchBar";
import ActionButtons from "./_components/ActionButtons";
import TrendingSpecs from "./_components/TrendingSpecs";
import RecommendedStrip from "./_components/RecommendedStrip";
import RecentRail from "./_components/RecentRail";
import OrgHighlights from "./_components/OrgHighlights";
import Section from "./_components/Section";
import SpecializationsBlock from "./_components/SpecializationsBlock";
import StatsStrip from "./_components/StatsStrip";
import HomepageSkeleton from "./_components/HomepageSkeleton";

// Guest versions
import GuestPopularStrip from "./_components/GuestPopularStrip";
import GuestHotPicks from "./_components/GuestHotPicks";
import GuestOrgShowcase from "./_components/GuestOrgShowcase";
import { useAuthStatus } from "@/hooks/useAuthStatus";

export default function Homepage() {
  const { continueReading, topUpvoted, specGroups, loading } = useHomepage();
  const isAuthenticated = useAuthStatus();

  // Provider load chưa xong
  if (loading || isAuthenticated === null) {
    return <HomepageSkeleton />;
  }

  // const isLoggedIn = isAuthenticated.isAuthenticated;
  const isLoggedIn = false;
  return (
    <div className={styles.pageShell}>
      <main className={styles.main}>
        {/* HERO SECTION */}
        <div className={styles.heroRow}>
          <div className={styles.heroMain}>
            <div>
              <h1 className={styles.heroTitle}>
                📚 Discover Trusted Academic Documents
              </h1>
              <p className={styles.heroSubtitle}>
                Search, save, and revisit high-quality resources across
                specializations — all in one place.
              </p>
            </div>
            <div className={styles.heroSearchRow}>
              <SearchBar />
            </div>
            <ActionButtons />
          </div>
          <div className={styles.heroAside}>
            <StatsStrip />
          </div>
        </div>

        <TrendingSpecs />

        {/* ======================= LOGGED-IN UI ======================= */}
        {isLoggedIn && (
          <>
            <RecommendedStrip />

            <Section
              title="✨ Continue Reading"
              items={continueReading}
              sectionKey="continue"
              defaultPageSize={8}
            />

            <Section
              title="👍 Top Upvoted"
              items={topUpvoted}
              sectionKey="top"
              defaultPageSize={8}
            />

            <OrgHighlights />
          </>
        )}

        {/* ======================= GUEST UI ======================= */}
        {!isLoggedIn && (
          <>
            <GuestPopularStrip />
            <GuestHotPicks />
            <GuestOrgShowcase />

            <Section
              title="👍 Top Upvoted by Community"
              items={topUpvoted}
              sectionKey="top"
              defaultPageSize={8}
            />
          </>
        )}

        {/* COMMON */}
        <SpecializationsBlock
          groups={specGroups}
          defaultGroupsPerPage={3}
          maxItemsPerGroup={8}
        />

        <RecentRail />
      </main>
    </div>
  );
}
