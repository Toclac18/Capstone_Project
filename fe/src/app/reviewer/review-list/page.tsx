"use client";

import { useState } from "react";
import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { TodoTab } from "./_components/TodoTab";
import { ReviewRequestsTab } from "./_components/ReviewRequestsTab";
import { ReviewedHistoryTab } from "./_components/ReviewedHistoryTab";
import styles from "./styles.module.css";
import { FileText, Clock, History } from "lucide-react";

type TabType = "todo" | "requests" | "history";

export default function ReviewListPage() {
  const [activeTab, setActiveTab] = useState<TabType>("requests");

  const tabs = [
    { 
      id: "requests" as TabType, 
      label: "Review Requests", 
      icon: FileText,
      description: "Documents waiting for invitation acceptance"
    },
    { 
      id: "todo" as TabType, 
      label: "Todo", 
      icon: Clock,
      description: "Documents assigned and pending review"
    },
    { 
      id: "history" as TabType, 
      label: "Reviewed History", 
      icon: History,
      description: "History of reviewed documents"
    },
  ];

  return (
    <div className={styles["page-container"]}>
      <Breadcrumb pageName="Review List" />

      {/* Tabs */}
      <div className={styles["tabs-container"]}>
        <div className={styles["tabs-list"]}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`${styles["tab-button"]} ${
                  activeTab === tab.id ? styles["tab-active"] : ""
                }`}
                title={tab.description}
              >
                <Icon className={styles["tab-icon"]} />
                <span className={styles["tab-label"]}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className={styles["tabs-content"]}>
        {activeTab === "todo" && <TodoTab />}
        {activeTab === "requests" && <ReviewRequestsTab />}
        {activeTab === "history" && <ReviewedHistoryTab />}
      </div>
    </div>
  );
}

