"use client";

import styles from "../styles.module.css";
import { useHomepage } from "../provider";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export default function TrendingSpecs() {
  const { specGroups } = useHomepage();
  const router = useRouter();

  const names = useMemo(() => {
    const ns = specGroups.map((g) => g.name).filter(Boolean);
    const unique = Array.from(new Set(ns));
    return unique.slice(0, 8);
  }, [specGroups]);

  if (!names.length) return null;

  const goToSpecialization = (name: string) => {
    const encoded = encodeURIComponent(name);
    router.push(`/search?specialization=${encoded}`);
  };

  return (
    <div className={styles.trendingRow}>
      <span className={styles.trendingLabel}>Trending specializations:</span>
      <div className={styles.trendingPills}>
        {names.map((name) => (
          <button
            key={name}
            type="button"
            className={styles.trendingPill}
            onClick={() => goToSpecialization(name)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
