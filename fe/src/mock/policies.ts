// src/mock/policies.ts
// Mock data for Policy Management - Simplified (one policy per type)

import {
  PolicyType,
  PolicyStatus,
} from "@/types/policy";
import type {
  Policy,
  UpdatePolicyRequest,
  PolicyViewResponse,
} from "@/types/policy";

// ---------- Helper Functions ----------
function nowIso() {
  return new Date().toISOString();
}

// ---------- Seed Data ----------
// One policy per type (7 policies total)
const seedPolicies: Policy[] = [
  {
    id: "policy-terms",
    type: PolicyType.TERMS_OF_SERVICE,
    title: "Terms of Service",
    content: `
      <h2>Terms of Service</h2>
      <p>Welcome to Readee System. By accessing or using our platform, you agree to be bound by these Terms of Service.</p>
      <h3>1. Acceptance of Terms</h3>
      <p>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.</p>
      <h3>2. Use License</h3>
      <p>Permission is granted to temporarily access the materials on Readee System for personal, non-commercial transitory viewing only.</p>
      <h3>3. User Accounts</h3>
      <p>You are responsible for maintaining the confidentiality of your account and password.</p>
      <h3>4. Content</h3>
      <p>Users are responsible for the content they upload and must ensure it complies with our guidelines.</p>
      <h3>5. Prohibited Uses</h3>
      <p>You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts.</p>
    `,
    status: PolicyStatus.ACTIVE,
    isRequired: true,
    updatedAt: nowIso(),
  },
  {
    id: "policy-privacy",
    type: PolicyType.PRIVACY_POLICY,
    title: "Privacy Policy",
    content: `
      <h2>Privacy Policy</h2>
      <p>Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.</p>
      <h3>1. Information We Collect</h3>
      <p>We collect information that you provide directly to us, including name, email, and usage data.</p>
      <h3>2. How We Use Your Information</h3>
      <p>We use the information we collect to provide, maintain, and improve our services.</p>
      <h3>3. Information Sharing</h3>
      <p>We do not sell, trade, or rent your personal information to third parties.</p>
      <h3>4. Data Security</h3>
      <p>We implement appropriate security measures to protect your personal information.</p>
      <h3>5. Your Rights</h3>
      <p>You have the right to access, update, or delete your personal information at any time.</p>
    `,
    status: PolicyStatus.ACTIVE,
    isRequired: true,
    updatedAt: nowIso(),
  },
  {
    id: "policy-cookie",
    type: PolicyType.COOKIE_POLICY,
    title: "Cookie Policy",
    content: `
      <h2>Cookie Policy</h2>
      <p>This Cookie Policy explains how Readee System uses cookies and similar technologies.</p>
      <h3>1. What Are Cookies</h3>
      <p>Cookies are small text files that are placed on your device when you visit our website.</p>
      <h3>2. Types of Cookies We Use</h3>
      <p>We use essential cookies, performance cookies, and functionality cookies.</p>
      <h3>3. Managing Cookies</h3>
      <p>You can control and manage cookies through your browser settings.</p>
    `,
    status: PolicyStatus.ACTIVE,
    isRequired: false,
    updatedAt: nowIso(),
  },
  {
    id: "policy-acceptable-use",
    type: PolicyType.ACCEPTABLE_USE,
    title: "Acceptable Use Policy",
    content: `
      <h2>Acceptable Use Policy</h2>
      <p>This policy outlines the acceptable use of Readee System services.</p>
      <h3>1. Prohibited Activities</h3>
      <p>Users must not engage in activities that violate laws or infringe on others' rights.</p>
      <h3>2. Content Guidelines</h3>
      <p>All uploaded content must comply with our content guidelines and community standards.</p>
      <h3>3. Enforcement</h3>
      <p>Violations of this policy may result in account suspension or termination.</p>
    `,
    status: PolicyStatus.ACTIVE,
    isRequired: true,
    updatedAt: nowIso(),
  },
  {
    id: "policy-refund",
    type: PolicyType.REFUND_POLICY,
    title: "Refund Policy",
    content: `
      <h2>Refund Policy</h2>
      <p>Our refund policy for premium document purchases.</p>
      <h3>1. Eligibility</h3>
      <p>Refunds are available within 7 days of purchase for unused premium documents.</p>
      <h3>2. Refund Process</h3>
      <p>To request a refund, contact our support team with your purchase details.</p>
      <h3>3. Processing Time</h3>
      <p>Refunds are processed within 5-10 business days.</p>
    `,
    status: PolicyStatus.ACTIVE,
    isRequired: false,
    updatedAt: nowIso(),
  },
  {
    id: "policy-copyright",
    type: PolicyType.COPYRIGHT_POLICY,
    title: "Copyright Policy",
    content: `
      <h2>Copyright Policy</h2>
      <p>This policy outlines how we handle copyright and intellectual property.</p>
      <h3>1. Intellectual Property Rights</h3>
      <p>All content on Readee System is protected by copyright and other intellectual property laws.</p>
      <h3>2. User Content</h3>
      <p>Users retain ownership of their content but grant us a license to use it on our platform.</p>
      <h3>3. Copyright Infringement</h3>
      <p>If you believe your copyright has been infringed, please contact us with details.</p>
    `,
    status: PolicyStatus.ACTIVE,
    isRequired: false,
    updatedAt: nowIso(),
  },
  {
    id: "policy-community",
    type: PolicyType.COMMUNITY_GUIDELINES,
    title: "Community Guidelines",
    content: `
      <h2>Community Guidelines</h2>
      <p>These guidelines help maintain a respectful and productive community.</p>
      <h3>1. Be Respectful</h3>
      <p>Treat all members with respect and kindness, regardless of differences.</p>
      <h3>2. Share Quality Content</h3>
      <p>Contribute meaningful, accurate, and helpful content to the community.</p>
      <h3>3. Follow Rules</h3>
      <p>Adhere to all platform rules and guidelines to ensure a positive experience for everyone.</p>
    `,
    status: PolicyStatus.ACTIVE,
    isRequired: false,
    updatedAt: nowIso(),
  },
];

// In-memory storage
let _policies: Policy[] = [...seedPolicies];

// Mock user acceptances (for testing)
const _acceptances: Map<string, { policyId: string; userId: string; acceptedAt: string }> = new Map();

// ---------- Public API ----------

/**
 * Get all policies (one per type)
 */
export function getAllPolicies(): Policy[] {
  return [..._policies];
}

/**
 * Get policy by ID
 */
export function getPolicyById(id: string): Policy | null {
  return _policies.find((p) => p.id === id) || null;
}

/**
 * Get policy by type (one policy per type)
 */
export function getPolicyByType(type: PolicyType): Policy | null {
  return _policies.find((p) => p.type === type) || null;
}

/**
 * Get active policy by type (for users to view)
 */
export function getActivePolicyByType(type: PolicyType): Policy | null {
  const policy = getPolicyByType(type);
  if (policy && policy.status === PolicyStatus.ACTIVE) {
    return policy;
  }
  return null;
}

/**
 * Get policy view with acceptance status
 */
export function getPolicyView(policyId: string, userId?: string): PolicyViewResponse | null {
  const policy = getPolicyById(policyId);
  if (!policy) return null;

  let hasAccepted = false;
  let acceptanceDate: string | undefined;

  if (userId) {
    const key = `${userId}:${policyId}`;
    const acceptance = _acceptances.get(key);
    if (acceptance) {
      hasAccepted = true;
      acceptanceDate = acceptance.acceptedAt;
    }
  }

  return {
    policy,
    hasAccepted,
    acceptanceDate,
  };
}

/**
 * Update policy by type
 */
export function updatePolicyByType(type: PolicyType, data: UpdatePolicyRequest): Policy | null {
  const index = _policies.findIndex((p) => p.type === type);
  if (index === -1) return null;

  const existing = _policies[index];
  const updated: Policy = {
    ...existing,
    ...(data.title && { title: data.title }),
    ...(data.content && { content: data.content }),
    ...(data.status && { status: data.status }),
    ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
    updatedAt: nowIso(),
  };

  _policies[index] = updated;
  return updated;
}

/**
 * Accept policy (for users)
 */
export function acceptPolicy(policyId: string, userId: string): boolean {
  const policy = getPolicyById(policyId);
  if (!policy) return false;

  const key = `${userId}:${policyId}`;
  _acceptances.set(key, {
    policyId,
    userId,
    acceptedAt: nowIso(),
  });

  return true;
}

/**
 * Reset mock data
 */
export function resetMockPolicies() {
  _policies = [...seedPolicies];
  _acceptances.clear();
}
