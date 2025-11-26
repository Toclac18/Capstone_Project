"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchMeta } from "@/services/search-document.service";
import type { SearchFilters, SearchMeta } from "@/types/documentResponse";
import { useSearch } from "../provider";
import styles from "../styles.module.css";

type LocalFilters = SearchFilters & {
  domains?: string[] | null;
  isPremium?: boolean | null;
  pointsFrom?: number | null;
  pointsTo?: number | null;
  publicYearFrom?: number | null;
  publicYearTo?: number | null;
};

export default function FilterModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { setFilters } = useSearch();
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState<LocalFilters>({});
  const [showAllDomains, setShowAllDomains] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const m = await fetchMeta();
        if (mounted) setMeta(m);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open]);

  const selectedDomains = useMemo(
    () => local.domains?.filter(Boolean) ?? [],
    [local.domains],
  );

  const specializationOptions = useMemo(() => {
    if (!meta) return [];
    if (selectedDomains.length > 0 && (meta as any).specializationsByDomain) {
      const set = new Set<string>();
      selectedDomains.forEach((d) => {
        const arr = (meta as any).specializationsByDomain?.[d];
        if (arr?.length) arr.forEach((s: string) => set.add(s));
      });
      return Array.from(set);
    }
    return meta.specializations ?? [];
  }, [meta, selectedDomains]);

  useEffect(() => {
    if (
      local.specialization &&
      !specializationOptions.includes(local.specialization as string)
    ) {
      setLocal((s) => ({ ...s, specialization: null as any }));
    }
  }, [specializationOptions, local.specialization]);

  const pointsMin = useMemo(() => {
    const m = (meta as any)?.pointsRange?.min;
    return Number.isFinite(m) ? Number(m) : 1;
  }, [meta]);
  const pointsMax = useMemo(() => {
    const m = (meta as any)?.pointsRange?.max;
    return Number.isFinite(m) ? Number(m) : 250;
  }, [meta]);

  // init mặc định cho slider khi bật premium
  useEffect(() => {
    if (
      local.isPremium &&
      (local.pointsFrom == null || local.pointsTo == null)
    ) {
      setLocal((s) => ({
        ...s,
        pointsFrom: s.pointsFrom ?? pointsMin,
        pointsTo: s.pointsTo ?? pointsMax,
      }));
    }
  }, [local.isPremium, pointsMin, pointsMax]);

  const canApply = useMemo(
    () =>
      !!(
        local.organization ||
        selectedDomains.length > 0 ||
        local.specialization ||
        local.publicYearFrom ||
        local.publicYearTo ||
        local.isPremium ||
        local.pointsFrom ||
        local.pointsTo
      ),
    [
      local.organization,
      selectedDomains.length,
      local.specialization,
      local.publicYearFrom,
      local.publicYearTo,
      local.isPremium,
      local.pointsFrom,
      local.pointsTo,
    ],
  );

  const apply = () => {
    const payload: SearchFilters = {
      ...local,
      organization: (local as any).organization ?? null,
      ...(selectedDomains.length
        ? { domains: selectedDomains }
        : { domains: null }),
      specialization: (local.specialization as any) ?? null,
      publicYearFrom: local.publicYearFrom ?? null,
      publicYearTo: local.publicYearTo ?? null,
      isPremium: local.isPremium ?? null,
      pointsFrom: local.isPremium ? (local.pointsFrom ?? null) : null,
      pointsTo: local.isPremium ? (local.pointsTo ?? null) : null,
      domain: null,
      publicYear: null,
    } as any;

    setFilters(payload);
    onClose();
  };

  const reset = () => {
    setLocal({});
    setFilters({});
    onClose();
  };

  if (!open) return null;

  const domainList = meta?.domains ?? [];
  const visibleDomains = showAllDomains ? domainList : domainList.slice(0, 6);

  const toggleDomain = (d: string) => {
    setLocal((prev) => {
      const curr = new Set(prev.domains ?? []);
      if (curr.has(d)) curr.delete(d);
      else curr.add(d);
      return { ...prev, domains: Array.from(curr) };
    });
  };

  const yearOptions = meta?.years ?? [];

  // Handlers cho dual-range
  const onChangePointsFrom = (val: number) => {
    setLocal((s) => {
      const nextFrom = Math.min(
        Math.max(pointsMin, val),
        s.pointsTo ?? pointsMax,
      );
      return { ...s, pointsFrom: nextFrom };
    });
  };
  const onChangePointsTo = (val: number) => {
    setLocal((s) => {
      const nextTo = Math.max(
        Math.min(pointsMax, val),
        s.pointsFrom ?? pointsMin,
      );
      return { ...s, pointsTo: nextTo };
    });
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Filters</h2>
          <button
            className={styles.iconBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loading || !meta ? (
          <div className={styles.modalBody}>Loading…</div>
        ) : (
          <div className={styles.modalBody}>
            {/* Organization */}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Organization</span>
              <select
                className={styles.select}
                value={(local as any).organization ?? ""}
                onChange={(e) =>
                  setLocal((s) => ({
                    ...s,
                    organization: e.target.value || null,
                  }))
                }
              >
                <option value="">Any</option>
                {meta.organizations.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            {/* Domain (multi) */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Domain</span>
              <div className={styles.checkboxGrid}>
                {visibleDomains.map((d) => {
                  const checked = selectedDomains.includes(d);
                  return (
                    <label key={d} className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDomain(d)}
                      />
                      <span>{d}</span>
                    </label>
                  );
                })}
              </div>
              {domainList.length > 6 && (
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => setShowAllDomains((v) => !v)}
                >
                  {showAllDomains ? "See less" : "See all"}
                </button>
              )}
            </div>

            {/* Specialization */}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Specialization</span>
              <select
                className={styles.select}
                value={(local.specialization as any) ?? ""}
                onChange={(e) =>
                  setLocal((s) => ({
                    ...s,
                    specialization: e.target.value || null,
                  }))
                }
                disabled={specializationOptions.length === 0}
              >
                <option value="">Any</option>
                {specializationOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            {/* Public year From/To */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Public year</span>
              <div className={styles.rangeGroup}>
                <select
                  className={styles.select}
                  value={local.publicYearFrom ?? ""}
                  onChange={(e) =>
                    setLocal((s) => ({
                      ...s,
                      publicYearFrom: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                >
                  <option value="">From</option>
                  {yearOptions.map((y) => (
                    <option key={`yf-${y}`} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <span className={styles.rangeSep}>to</span>
                <select
                  className={styles.select}
                  value={local.publicYearTo ?? ""}
                  onChange={(e) =>
                    setLocal((s) => ({
                      ...s,
                      publicYearTo: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                >
                  <option value="">To</option>
                  {yearOptions.map((y) => (
                    <option key={`yt-${y}`} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Premium & Points (range slider) */}
            <div className={styles.field}>
              <label className={styles.checkboxInline}>
                <input
                  type="checkbox"
                  checked={!!local.isPremium}
                  onChange={(e) =>
                    setLocal((s) => ({
                      ...s,
                      isPremium: e.target.checked ? true : null,
                      ...(e.target.checked
                        ? {
                            pointsFrom: s.pointsFrom ?? pointsMin,
                            pointsTo: s.pointsTo ?? pointsMax,
                          }
                        : { pointsFrom: null, pointsTo: null }),
                    }))
                  }
                />
                <span className={styles.fieldLabelInline}> Premium only</span>
              </label>

              {local.isPremium ? (
                <div className={styles.pointsSliderBlock}>
                  <div className={styles.pointsHeader}>
                    <span className={styles.pointsLabel}>Points</span>
                    <div className={styles.pointsEnds}>
                      <span className={styles.pointsPill}>{pointsMin}</span>
                      <span className={styles.pointsPill}>{pointsMax}</span>
                    </div>
                  </div>

                  <div className={styles.dualSlider}>
                    {/* track highlight */}
                    <div
                      className={styles.dualSliderTrack}
                      style={
                        {
                          "--min": String(pointsMin),
                          "--max": String(pointsMax),
                          "--from": String(local.pointsFrom ?? pointsMin),
                          "--to": String(local.pointsTo ?? pointsMax),
                        } as React.CSSProperties
                      }
                    />
                    {/* from thumb */}
                    <input
                      aria-label="Points from"
                      type="range"
                      min={pointsMin}
                      max={pointsMax}
                      step={1}
                      value={local.pointsFrom ?? pointsMin}
                      onChange={(e) =>
                        onChangePointsFrom(Number(e.target.value))
                      }
                      className={styles.range}
                    />
                    {/* to thumb */}
                    <input
                      aria-label="Points to"
                      type="range"
                      min={pointsMin}
                      max={pointsMax}
                      step={1}
                      value={local.pointsTo ?? pointsMax}
                      onChange={(e) => onChangePointsTo(Number(e.target.value))}
                      className={styles.range}
                    />
                  </div>

                  <div className={styles.pointsCurrent}>
                    <span className={styles.pointsPill}>
                      {local.pointsFrom ?? pointsMin}
                    </span>
                    <span className={styles.pointsPill}>
                      {local.pointsTo ?? pointsMax}
                    </span>
                  </div>
                </div>
              ) : (
                <p className={styles.inlineHelp}>
                  Check on premium to enable points filter
                </p>
              )}
            </div>
          </div>
        )}

        <div className={styles.modalFooter}>
          <button className={styles.ghostBtn} onClick={reset}>
            Reset
          </button>
          <div className={styles.spacer} />
          <button
            className={styles.primaryBtn}
            onClick={apply}
            disabled={!canApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
