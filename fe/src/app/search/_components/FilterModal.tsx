// src/app/search/_components/FilterModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSearchMeta } from "@/services/search-document.service";
import type { SearchFilters, SearchMeta } from "@/types/document-search";
import { useSearch } from "../provider";
import styles from "../styles.module.css";

type LocalFilters = {
  // nhiều organization (checkbox)
  organizationIds?: string[] | null;

  // nhiều domain
  domainIds?: string[] | null;

  // 1 specialization, lọc theo domainIds
  specializationId?: string | null;

  docTypeId?: string | null;
  tagIds?: string[] | null;

  isPremium?: boolean | null;
  priceFrom?: number | null;
  priceTo?: number | null;
  yearFrom?: number | null;
  yearTo?: number | null;
};

export default function FilterModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { filters, setFilters } = useSearch();
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const [local, setLocal] = useState<LocalFilters>({});

  const [showAllOrgs, setShowAllOrgs] = useState(false);
  const [showAllDomains, setShowAllDomains] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  // Load meta và sync local state với filters từ context khi mở modal
  useEffect(() => {
    if (!open) return;

    // Sync local state với filters đã apply từ context
    setLocal({
      organizationIds: filters.organizationIds ?? null,
      domainIds: filters.domainIds ?? null,
      specializationId: filters.specializationIds?.[0] ?? null,
      docTypeId: filters.docTypeIds?.[0] ?? null,
      tagIds: filters.tagIds ?? null,
      yearFrom: filters.yearFrom ?? null,
      yearTo: filters.yearTo ?? null,
      isPremium: filters.isPremium ?? null,
      priceFrom: filters.priceFrom ?? null,
      priceTo: filters.priceTo ?? null,
    });

    // Reset show more states
    setShowAllOrgs(false);
    setShowAllDomains(false);
    setShowAllTags(false);

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const m = await fetchSearchMeta();
        if (mounted) {
          setMeta(m);
        }
      } catch (err) {
        console.error("[FilterModal] fetchSearchMeta error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // --- DATA MAPPING ---

  const organizations = useMemo(() => meta?.organizations ?? [], [meta]);
  const domains = useMemo(() => meta?.domains ?? [], [meta]);
  const tags = useMemo(() => meta?.tags ?? [], [meta]);
  const docTypes = useMemo(() => meta?.docTypes ?? [], [meta]);

  const selectedOrgIds = useMemo(
    () => local.organizationIds ?? [],
    [local.organizationIds],
  );

  const selectedDomainIds = useMemo(
    () => local.domainIds ?? [],
    [local.domainIds],
  );

  const selectedTagIds = useMemo(() => local.tagIds ?? [], [local.tagIds]);

  // specialization options phụ thuộc domainIds đã chọn
  const specializationOptions = useMemo(() => {
    if (!meta) return [];
    if (!selectedDomainIds.length) return meta.specializations;
    return meta.specializations.filter((s) =>
      selectedDomainIds.includes(s.domainId ?? ""),
    );
  }, [meta, selectedDomainIds]);

  // reset specialization nếu không còn hợp lệ
  useEffect(() => {
    if (!local.specializationId) return;
    const ok = specializationOptions.some(
      (s) => s.id === local.specializationId,
    );
    if (!ok) {
      setLocal((prev) => ({ ...prev, specializationId: null }));
    }
  }, [specializationOptions, local.specializationId]);

  const priceMin = useMemo(() => {
    const v = meta?.priceRange?.min;
    return Number.isFinite(v) ? Number(v) : 0;
  }, [meta]);

  const priceMax = useMemo(() => {
    const v = meta?.priceRange?.max;
    return Number.isFinite(v) ? Number(v) : 0;
  }, [meta]);

  // Init slider khi bật premium
  useEffect(() => {
    if (local.isPremium && (local.priceFrom == null || local.priceTo == null)) {
      setLocal((s) => ({
        ...s,
        priceFrom: s.priceFrom ?? priceMin,
        priceTo: s.priceTo ?? priceMax,
      }));
    }
  }, [local.isPremium, priceMin, priceMax]);

  // --- VISIBLE LISTS (6 default + see more) ---

  const visibleOrgs = useMemo(
    () => (showAllOrgs ? organizations : organizations.slice(0, 6)),
    [organizations, showAllOrgs],
  );

  const visibleDomains = useMemo(
    () => (showAllDomains ? domains : domains.slice(0, 6)),
    [domains, showAllDomains],
  );

  const visibleTags = useMemo(
    () => (showAllTags ? tags : tags.slice(0, 6)),
    [tags, showAllTags],
  );

  // --- CHECK IF LOCAL STATE DIFFERS FROM APPLIED FILTERS ---
  // Enable Apply when local state is different from current applied filters
  const hasChanges = useMemo(() => {
    const appliedOrgIds = filters.organizationIds ?? [];
    const appliedDomainIds = filters.domainIds ?? [];
    const appliedTagIds = filters.tagIds ?? [];
    const appliedSpecId = filters.specializationIds?.[0] ?? null;
    const appliedDocTypeId = filters.docTypeIds?.[0] ?? null;

    // Compare arrays
    const arraysEqual = (a: string[], b: string[]) =>
      a.length === b.length && a.every((v) => b.includes(v));

    const orgChanged = !arraysEqual(selectedOrgIds, appliedOrgIds);
    const domainChanged = !arraysEqual(selectedDomainIds, appliedDomainIds);
    const tagChanged = !arraysEqual(selectedTagIds, appliedTagIds);
    const specChanged = (local.specializationId ?? null) !== appliedSpecId;
    const docTypeChanged = (local.docTypeId ?? null) !== appliedDocTypeId;
    const yearFromChanged =
      (local.yearFrom ?? null) !== (filters.yearFrom ?? null);
    const yearToChanged = (local.yearTo ?? null) !== (filters.yearTo ?? null);
    const premiumChanged =
      (local.isPremium ?? null) !== (filters.isPremium ?? null);
    const priceFromChanged =
      (local.priceFrom ?? null) !== (filters.priceFrom ?? null);
    const priceToChanged =
      (local.priceTo ?? null) !== (filters.priceTo ?? null);

    return (
      orgChanged ||
      domainChanged ||
      tagChanged ||
      specChanged ||
      docTypeChanged ||
      yearFromChanged ||
      yearToChanged ||
      premiumChanged ||
      priceFromChanged ||
      priceToChanged
    );
  }, [
    filters,
    selectedOrgIds,
    selectedDomainIds,
    selectedTagIds,
    local.specializationId,
    local.docTypeId,
    local.yearFrom,
    local.yearTo,
    local.isPremium,
    local.priceFrom,
    local.priceTo,
  ]);

  // --- HANDLERS ---

  const toggleOrg = (id: string) => {
    setLocal((prev) => {
      const curr = new Set(prev.organizationIds ?? []);
      if (curr.has(id)) curr.delete(id);
      else curr.add(id);
      return { ...prev, organizationIds: Array.from(curr) };
    });
  };

  const toggleDomain = (id: string) => {
    setLocal((prev) => {
      const curr = new Set(prev.domainIds ?? []);
      if (curr.has(id)) curr.delete(id);
      else curr.add(id);
      return { ...prev, domainIds: Array.from(curr) };
    });
  };

  const toggleTag = (tagId: string) => {
    setLocal((prev) => {
      const curr = new Set(prev.tagIds ?? []);
      if (curr.has(tagId)) curr.delete(tagId);
      else curr.add(tagId);
      return { ...prev, tagIds: Array.from(curr) };
    });
  };

  const yearOptions = meta?.years ?? [];

  const apply = () => {
    const payload: SearchFilters = {
      organizationIds: selectedOrgIds.length ? selectedOrgIds : undefined,

      domainIds:
        local.domainIds && local.domainIds.length ? local.domainIds : undefined,

      specializationIds: local.specializationId
        ? [local.specializationId]
        : undefined,

      docTypeIds: local.docTypeId ? [local.docTypeId] : undefined,

      tagIds: selectedTagIds.length ? selectedTagIds : undefined,

      yearFrom: local.yearFrom ?? undefined,
      yearTo: local.yearTo ?? undefined,

      isPremium: local.isPremium ?? undefined,
      priceFrom: local.isPremium ? (local.priceFrom ?? undefined) : undefined,
      priceTo: local.isPremium ? (local.priceTo ?? undefined) : undefined,
    };

    console.log(
      "[FilterModal] Apply payload:",
      JSON.stringify(payload, null, 2),
    );
    setFilters(payload);
    onClose();
  };

  const reset = () => {
    setLocal({});
    setFilters({});
    onClose();
  };

  if (!open) return null;

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
            {/* Organizations: checkbox grid, multi-select */}
            {organizations.length > 0 && (
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Organizations</span>
                <div className={styles.checkboxGrid}>
                  {visibleOrgs.map((o) => {
                    const checked = selectedOrgIds.includes(o.id);
                    return (
                      <label key={o.id} className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOrg(o.id)}
                        />
                        <span>{o.name}</span>
                      </label>
                    );
                  })}
                </div>
                {organizations.length > 6 && (
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => setShowAllOrgs((v) => !v)}
                  >
                    {showAllOrgs ? "See less" : "See more"}
                  </button>
                )}
              </div>
            )}

            {/* Domains: checkbox grid, multi-select */}
            {domains.length > 0 && (
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Domains</span>
                <div className={styles.checkboxGrid}>
                  {visibleDomains.map((d) => {
                    const checked = selectedDomainIds.includes(d.id);
                    return (
                      <label key={d.id} className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDomain(d.id)}
                        />
                        <span>{d.name}</span>
                      </label>
                    );
                  })}
                </div>
                {domains.length > 6 && (
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => setShowAllDomains((v) => !v)}
                  >
                    {showAllDomains ? "See less" : "See more"}
                  </button>
                )}
              </div>
            )}

            {/* Specialization: lọc theo domainIds đã chọn */}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Specialization</span>
              <select
                className={styles.select}
                value={local.specializationId ?? ""}
                onChange={(e) =>
                  setLocal((s) => ({
                    ...s,
                    specializationId: e.target.value || null,
                  }))
                }
                disabled={specializationOptions.length === 0}
              >
                <option value="">Any</option>
                {specializationOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Document type */}
            {docTypes.length > 0 && (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Document type</span>
                <select
                  className={styles.select}
                  value={local.docTypeId ?? ""}
                  onChange={(e) =>
                    setLocal((s) => ({
                      ...s,
                      docTypeId: e.target.value || null,
                    }))
                  }
                >
                  <option value="">Any</option>
                  {docTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* Tags: checkbox grid + see more/less */}
            {tags.length > 0 && (
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Tags</span>
                <div className={styles.checkboxGrid}>
                  {visibleTags.map((tag) => {
                    const id = tag.id ?? String(tag.code);
                    const checked = selectedTagIds.includes(id);
                    return (
                      <label key={id} className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTag(id)}
                        />
                        <span>{tag.name}</span>
                      </label>
                    );
                  })}
                </div>
                {tags.length > 6 && (
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => setShowAllTags((v) => !v)}
                  >
                    {showAllTags ? "See less" : "See more"}
                  </button>
                )}
              </div>
            )}

            {/* Year From/To */}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Year</span>
              <div className={styles.rangeGroup}>
                <select
                  className={styles.select}
                  value={local.yearFrom ?? ""}
                  onChange={(e) =>
                    setLocal((s) => ({
                      ...s,
                      yearFrom: e.target.value ? Number(e.target.value) : null,
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
                  value={local.yearTo ?? ""}
                  onChange={(e) =>
                    setLocal((s) => ({
                      ...s,
                      yearTo: e.target.value ? Number(e.target.value) : null,
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

            {/* Premium only toggle */}
            <div className={styles.field}>
              <label className={styles.toggleLabel}>
                <span className={styles.fieldLabel}>
                  Premium documents only
                </span>
                <div className={styles.toggleWrapper}>
                  <input
                    type="checkbox"
                    checked={!!local.isPremium}
                    onChange={(e) =>
                      setLocal((s) => ({
                        ...s,
                        isPremium: e.target.checked ? true : null,
                      }))
                    }
                    className={styles.toggleInput}
                  />
                  <span className={styles.toggleSlider} />
                </div>
              </label>
              <p className={styles.inlineHelp}>
                Premium documents cost 100 points to access
              </p>
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
            disabled={!hasChanges}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
