"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import type { Policy } from "@/types/policy";
import { 
  getAllPolicies, 
  activatePolicy
} from "@/services/policyService";
import { useToast, toast } from "@/components/ui/toast";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import { CreatePolicyModal } from "./CreatePolicyModal";
import { UpdatePolicyModal } from "./UpdatePolicyModal";
import { PolicyList } from "./PolicyList";
import styles from "./styles.module.css";

export function PolicyManagement() {
  const { showToast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewPolicy, setViewPolicy] = useState<Policy | null>(null);
  const [_isViewerOpen, setIsViewerOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmActivate, setConfirmActivate] = useState<Policy | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Fetch all policies
  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllPolicies();
      // Sort: active policy first, then by created date descending
      const sorted = [...data].sort((a, b) => {
        // Active policies first
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        // Then by created date descending
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setPolicies(sorted);
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

  // Handle view
  const handleView = (policy: Policy) => {
    setViewPolicy(policy);
    setIsViewerOpen(true);
  };

  // Handle activate - show confirm dialog first
  const handleActivate = (policy: Policy) => {
    setConfirmActivate(policy);
  };

  // Confirm activate
  const handleConfirmActivate = async () => {
    if (!confirmActivate) return;

    setIsActivating(true);
    try {
      await activatePolicy(confirmActivate.id);
      showToast(toast.success("Success", `Policy version ${confirmActivate.version} activated`));
      setConfirmActivate(null);
      fetchPolicies();
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to activate policy";
      showToast(toast.error("Error", errorMessage));
    } finally {
      setIsActivating(false);
    }
  };

  // Cancel activate
  const handleCancelActivate = () => {
    setConfirmActivate(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Term of User Policy Management</h1>
          <p className={styles.subtitle}>
            Manage policy versions. Only one version can be active at a time.
          </p>
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className={styles.createButtonIcon} />
          Create New Version
        </button>
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
        onActivate={handleActivate}
      />

      {/* Confirm Activate Modal */}
      {confirmActivate && (
        <ConfirmModal
          open={!!confirmActivate}
          title="Activate Policy Version"
          content={`Are you sure you want to activate version ${confirmActivate.version}?`}
          subContent="This will deactivate the currently active policy version. Only one version can be active at a time."
          confirmLabel="Activate"
          cancelLabel="Cancel"
          loading={isActivating}
          onConfirm={handleConfirmActivate}
          onCancel={handleCancelActivate}
        />
      )}

      {/* Policy Viewer */}
      {viewPolicy && (
        <div
          className={styles.modalBackdrop}
          onClick={() => {
            setIsViewerOpen(false);
            setViewPolicy(null);
          }}
        >
          <div className={styles.viewerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.viewerHeader}>
              <h2>{viewPolicy.title} - Version {viewPolicy.version}</h2>
              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => {
                  setIsViewerOpen(false);
                  setViewPolicy(null);
                }}
              >
                ✕
              </button>
            </div>
            <div
              className={styles.viewerBody}
              dangerouslySetInnerHTML={{ __html: viewPolicy.content }}
            />
          </div>
        </div>
      )}

      {/* Create Policy Modal */}
      <CreatePolicyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchPolicies();
        }}
      />

      {/* Update Policy Modal */}
      {editPolicy && (
        <UpdatePolicyModal
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
