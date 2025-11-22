import { BaseEntity } from './base';

/**
 * Policy types - các loại policy trong hệ thống
 */
export enum PolicyType {
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  COOKIE_POLICY = 'COOKIE_POLICY',
  ACCEPTABLE_USE = 'ACCEPTABLE_USE',
  REFUND_POLICY = 'REFUND_POLICY',
  COPYRIGHT_POLICY = 'COPYRIGHT_POLICY',
  COMMUNITY_GUIDELINES = 'COMMUNITY_GUIDELINES',
}

/**
 * Policy status - simplified to only ACTIVE and INACTIVE
 */
export enum PolicyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Policy entity - simplified (one policy per type)
 */
export interface Policy {
  id: string;
  type: PolicyType;
  title: string;
  content: string; // HTML content
  status: PolicyStatus;
  isRequired: boolean; // User must accept before using system
  updatedAt: string;
}

/**
 * Request to update policy - simplified
 */
export interface UpdatePolicyRequest {
  title?: string;
  content?: string;
  status?: PolicyStatus;
  isRequired?: boolean;
}

/**
 * User acceptance record (for tracking)
 */
export interface PolicyAcceptance {
  id: string;
  policyId: string;
  userId: string;
  acceptedAt: string;
}

/**
 * Response when user views policy
 */
export interface PolicyViewResponse {
  policy: Policy;
  hasAccepted: boolean; // Whether current user has accepted this policy
  acceptanceDate?: string; // When user accepted (if applicable)
}

