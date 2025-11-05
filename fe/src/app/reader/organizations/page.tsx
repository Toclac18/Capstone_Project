"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchOrganizations, type OrganizationSummary } from "./api";
import { Pagination } from "@/components/ui/pagination";
import styles from "./styles.module.css";

type LoadState = "loading" | "success" | "empty" | "error";

const ITEMS_PER_PAGE = 8;

export default function Page() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<OrganizationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const run = async () => {
      setState("loading");
      try {
        const res = await fetchOrganizations();
        setItems(res.items);
        setState(res.items.length ? "success" : "empty");
        setCurrentPage(1); // Reset to first page when data changes
      } catch (e: any) {
        setError(e?.message || "Unable to load organization list. Please try again later.");
        setState("error");
      }
    };
    run();
  }, []);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  const rows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return items
      .slice(startIndex, endIndex)
      .map((org) => ({
        id: org.id,
        name: org.name,
        type: org.type,
        joinDate: org.joinDate,
        logo: org.logo,
      }));
  }, [items, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className={styles["page-container"]}>
      <Breadcrumb pageName="My Organizations" />

      {state === "loading" && (
        <div className={styles["loading-container"]}>
          <div className={styles["loading-skeleton"]} />
          <div className={styles["loading-skeleton-large"]} />
        </div>
      )}

      {state === "error" && (
        <div className={styles["error-container"]}>
          {error}
        </div>
      )}

      {state === "empty" && (
        <div className={styles["empty-container"]}>
          You are not in any organizations.
        </div>
      )}

      {state === "success" && (
        <div className={styles["table-container"]}>
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-3 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
                <TableHead className="xl:pl-7.5">Organization</TableHead>
                <TableHead>Organization Type</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right xl:pr-7.5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="border-b border-stroke last:border-b-0 dark:border-stroke-dark">
                  <TableCell className="xl:pl-7.5">
                    <div className={styles["table-org-cell"]}>
                      {r.logo ? (
                        <img
                          src={r.logo}
                          alt={`${r.name} logo`}
                          className={styles["table-logo"]}
                        />
                      ) : (
                        <div className={styles["table-logo-fallback"]}>
                          <span className={styles["table-logo-fallback-text"]}>
                            {r.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className={styles["table-org-name"]}>{r.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className={styles["table-text"]}>{r.type}</TableCell>
                  <TableCell className={styles["table-text"]}>
                    {new Date(r.joinDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right xl:pr-7.5">
                    <button
                      onClick={() => router.push(`/reader/organizations/${r.id}`)}
                      className={styles["btn-view"]}
                    >
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {items.length > ITEMS_PER_PAGE && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={items.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
              loading={false}
            />
          )}
        </div>
      )}
    </main>
  );
}


