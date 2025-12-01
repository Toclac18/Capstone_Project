"use client";

import { useEffect, useState } from "react";
import { useReader } from "@/hooks/useReader";
import PolicyViewer from "@/components/PolicyViewer/PolicyViewer";
import { PolicyType } from "@/types/policy";
import { getActivePolicyByType, getPolicyView } from "@/services/policyService";

/**
 * Component to check and enforce Terms of Service acceptance
 * for READER, REVIEWER, and ORGANIZATION_ADMIN roles
 */
export default function PolicyAcceptanceGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, readerId, loading, isAuthenticated } = useReader();
  const [showPolicyViewer, setShowPolicyViewer] = useState(false);
  const [checking, setChecking] = useState(true);

  // Roles that need to accept Terms of Service
  const rolesRequiringAcceptance: string[] = [
    "READER",
    "REVIEWER",
    "ORGANIZATION",
  ];

  useEffect(() => {
    // Only check if user is authenticated and has a role that requires acceptance
    if (loading || !isAuthenticated || !role || !readerId) {
      setChecking(false);
      return;
    }

    // Skip check for roles that don't require acceptance
    if (!rolesRequiringAcceptance.includes(role)) {
      setChecking(false);
      return;
    }

    // Check if user has accepted Terms of Service
    const checkAcceptance = async () => {
      try {
        // Get active Terms of Service policy
        const policy = await getActivePolicyByType(PolicyType.TERMS_OF_SERVICE);

        if (!policy) {
          // No active policy, allow access
          setChecking(false);
          return;
        }

        // If policy is required, check acceptance status
        if (policy.isRequired) {
          try {
            // Check if user has accepted this policy
            const view = await getPolicyView(policy.id, readerId);

            if (!view.hasAccepted) {
              // User hasn't accepted, show policy viewer
              setShowPolicyViewer(true);
            }
          } catch (acceptanceError) {
            // If checking acceptance fails, but policy is required, show it anyway
            setShowPolicyViewer(true);
          }
        }
      } catch (error) {
        // If there's an error fetching policy, don't block access
      } finally {
        setChecking(false);
      }
    };

    checkAcceptance();
  }, [loading, isAuthenticated, role, readerId]);

  const handleAccept = () => {
    // Close the policy viewer after acceptance
    setShowPolicyViewer(false);
  };

  // Show loading state while checking
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <PolicyViewer
        isOpen={showPolicyViewer}
        onClose={() => {}} // Prevent closing without accepting
        policyType={PolicyType.TERMS_OF_SERVICE}
        userId={readerId || undefined}
        onAccept={handleAccept}
        showAcceptButton={true}
        disableClose={true} // Prevent closing until user accepts
      />
    </>
  );
}
