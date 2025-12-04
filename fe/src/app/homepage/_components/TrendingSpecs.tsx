"use client";

import styles from "../styles.module.css";
import { useHomepage } from "../provider";
import { useMemo } from "react";

/**
 * TrendingSpecs không đẩy URL.
 * Nếu parent muốn điều hướng trang search, parent truyền onSelect().
 */
export default function TrendingSpecs({
  onSelect,
}: {
  onSelect?: (name: string) => void;
}) {
  const { specGroups } = useHomepage();

  const names = useMemo(() => {
    const ns = specGroups.map((g) => g.name).filter(Boolean);
    const unique = Array.from(new Set(ns));
    return unique.slice(0, 8);
  }, [specGroups]);

  if (!names.length) return null;

  return (
    <div className={styles.trendingRow}>
      <span className={styles.trendingLabel}>Trending specializations:</span>

      <div className={styles.trendingPills}>
        {names.map((name) => (
          <button
            key={name}
            type="button"
            className={styles.trendingPill}
            onClick={() => onSelect?.(name)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
