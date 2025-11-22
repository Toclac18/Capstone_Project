"use client";

import { useState, useEffect } from "react";
import type { Policy } from "@/types/policy";
import { getAllPolicies, updatePolicyByType } from "@/services/policyService";
import { useToast, toast } from "@/components/ui/toast";
import { Eye } from "lucide-react";
import PolicyViewer from "@/components/PolicyViewer/PolicyViewer";
import { EditPolicyModal } from "./EditPolicyModal";
import { PolicyType, PolicyStatus } from "@/types/policy";
import { PolicyList } from "./PolicyList";
import styles from "./styles.module.css";

export function PolicyManagement() {
  const { showToast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewPolicy, setViewPolicy] = useState<Policy | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch all policies
  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllPolicies();
      setPolicies(data);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error
          ? e.message
          : "Failed to fetch policies";
      setError(errorMessage);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPolicies();
  }, []);

  // Handle status change
  const handleStatusChange = async (policy: Policy, newStatus: PolicyStatus) => {
    if (policy.status === newStatus) return;

    try {
      await updatePolicyByType(policy.type, { status: newStatus });
      showToast(toast.success("Success", `Policy status updated to ${newStatus}`));
      fetchPolicies(); // Re-fetch policies to update the list
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to update policy status";
      showToast(toast.error("Error", errorMessage));
    }
  };

  // Handle view
  const handleView = (policy: Policy) => {
    setViewPolicy(policy);
    setIsViewerOpen(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Policy Management</h1>
          <p className={styles.subtitle}>
            Manage system policies and terms of service
          </p>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      <PolicyList
        policies={policies}
        loading={loading}
        onView={handleView}
        onEdit={(policy) => {
          setEditPolicy(policy);
          setIsEditModalOpen(true);
        }}
        onStatusChange={handleStatusChange}
      />

      {/* Policy Viewer */}
      {viewPolicy && (
        <PolicyViewer
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setViewPolicy(null);
          }}
          policyType={viewPolicy.type as PolicyType}
          showAcceptButton={false}
        />
      )}

      {/* Edit Policy Modal */}
      {editPolicy && (
        <EditPolicyModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditPolicy(null);
          }}
          onSuccess={() => {
            fetchPolicies();
          }}
          policy={editPolicy}
        />
      )}
    </div>
  );
}
