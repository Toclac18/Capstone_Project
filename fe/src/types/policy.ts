/**
 * Policy entity - version-based (Term of User only)
 */
export interface Policy {
  id: string;
  version: string; // e.g., "1.0", "2.0", "v1", "v2"
  title: string;
  content: string; // HTML content
  isActive: boolean; // Only one policy can be active at a time
  createdAt: string;
  updatedAt: string;
}

/**
 * Request to create a new policy version
 */
export interface CreatePolicyRequest {
  version: string;
  title: string;
  content: string;
}

/**
 * Request to update policy (title and content only, version is immutable)
 */
export interface UpdatePolicyRequest {
  title?: string;
  content?: string;
}

