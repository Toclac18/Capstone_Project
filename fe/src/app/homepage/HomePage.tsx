"use client";

import styles from "./styles.module.css";
import { useHomepage } from "./provider";
import SearchBar from "./_components/SearchBar";
import ActionButtons from "./_components/ActionButtons";
import Section from "./_components/Section";
import StatsStrip from "./_components/StatsStrip";
import RecommendedStrip from "./_components/RecommendedStrip";
import TrendingSpecs from "./_components/TrendingSpecs";
import OrgHighlights from "./_components/OrgHighlights";
import SpecializationsBlock from "./_components/SpecializationsBlock";
import RecentRail from "./_components/RecentRail";
import HomepageFooter from "./_components/Footer";
import HomepageSkeleton from "./_components/HomepageSkeleton";

export default function Homepage() {
  const { continueReading, topUpvoted, specGroups, loading } = useHomepage();

  if (loading) {
    return <HomepageSkeleton />;
  }

  return (
    <div className={styles.pageShell}>
      <main className={styles.main}>
        <div className={styles.heroRow}>
          <div className={styles.heroMain}>
            <h1 className={styles.heroTitle}>
              Discover trusted academic documents
            </h1>
            <p className={styles.heroSubtitle}>
              Search, save, and revisit high-quality resources across
              specializations — all in one place.
            </p>
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

        <RecommendedStrip />

        <Section
          title="Continue reading"
          items={continueReading}
          sectionKey="continue"
          defaultPageSize={8}
        />

        <Section
          title="Top upvoted"
          items={topUpvoted}
          sectionKey="top"
          defaultPageSize={8}
        />

        <OrgHighlights />

        <SpecializationsBlock
          groups={specGroups}
          defaultGroupsPerPage={3}
          maxItemsPerGroup={8}
        />

        <RecentRail />
      </main>
      <HomepageFooter />
    </div>
  );
}
