"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchMeta } from "@/services/searchDocumentService";
import type { SearchFilters, SearchMeta } from "@/types/search";
import { useSearch } from "../SearchProvider";
import styles from "../styles.module.css";

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
  const [local, setLocal] = useState<SearchFilters>({});

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const m = await fetchMeta();
        if (mounted) setMeta(m);
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [open]);

  const specializationOptions = useMemo(() => {
    if (!meta) return [];
    if (local.domain && meta.specializationsByDomain?.[local.domain]) {
      return meta.specializationsByDomain[local.domain];
    }
    return meta.specializations ?? [];
  }, [meta, local.domain]);

  useEffect(() => {
    if (
      local.specialization &&
      !specializationOptions.includes(local.specialization)
    ) {
      setLocal((s) => ({ ...s, specialization: null }));
    }
  }, [specializationOptions, local.specialization]);

  const canApply = useMemo(
    () =>
      !!(
        local.organization ||
        local.domain ||
        local.specialization ||
        local.publicYear
      ),
    [local],
  );

  const apply = () => {
    setFilters({ ...local });
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
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Organization</span>
              <select
                className={styles.select}
                value={local.organization ?? ""}
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

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Domain</span>
              <select
                className={styles.select}
                value={local.domain ?? ""}
                onChange={(e) =>
                  setLocal((s) => ({
                    ...s,
                    domain: e.target.value || null,
                  }))
                }
              >
                <option value="">Any</option>
                {meta.domains.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Specialization</span>
              <select
                className={styles.select}
                value={local.specialization ?? ""}
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

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Public year</span>
              <select
                className={styles.select}
                value={local.publicYear ?? ""}
                onChange={(e) =>
                  setLocal((s) => ({
                    ...s,
                    publicYear: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              >
                <option value="">Any</option>
                {meta.years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
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
