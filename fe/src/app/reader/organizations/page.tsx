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
import styles from "./styles.module.css";

type LoadState = "loading" | "success" | "empty" | "error";

export default function Page() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<OrganizationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setState("loading");
      try {
        const res = await fetchOrganizations();
        setItems(res.items);
        setState(res.items.length ? "success" : "empty");
      } catch (e: any) {
        setError(e?.message || "Unable to load organization list. Please try again later.");
        setState("error");
      }
    };
    run();
  }, []);

  const rows = useMemo(() => {
    return items.map((org) => ({
      id: org.id,
      name: org.name,
      type: org.type,
      joinDate: org.joinDate,
      logo: org.logo,
    }));
  }, [items]);

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
        </div>
      )}
    </main>
  );
}


