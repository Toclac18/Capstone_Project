import { apiClient } from "./http";
import type {
  Policy,
  CreatePolicyRequest,
  UpdatePolicyRequest,
} from "@/types/policy";

// BE response wrapper
interface SuccessResponse<T> {
  data: T;
  meta?: any;
}

/**
 * Get all policies (ordered by creation date, newest first)
 */
export async function getAllPolicies(): Promise<Policy[]> {
  const res = await apiClient.get<SuccessResponse<Policy[]>>("/policies");
  
  // Handle SuccessResponse wrapper
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<Policy[]>).data;
  }
  return res.data as Policy[];
}

/**
 * Get active policy (PUBLIC - for users during registration)
 */
export async function getActivePolicy(): Promise<Policy> {
  const res = await apiClient.get<SuccessResponse<Policy>>("/policies/active");
  
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<Policy>).data;
  }
  return res.data as Policy;
}

/**
 * Get policy by ID (for admin)
 */
export async function getPolicyById(id: string): Promise<Policy> {
  const res = await apiClient.get<SuccessResponse<Policy>>(`/policies/${id}`);
  
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<Policy>).data;
  }
  return res.data as Policy;
}

/**
 * Create a new policy version
 */
export async function createPolicy(data: CreatePolicyRequest): Promise<Policy> {
  const res = await apiClient.post<SuccessResponse<Policy>>(
    "/policies",
    data
  );
  
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<Policy>).data;
  }
  return res.data as Policy;
}

/**
 * Update policy (title and content only, version is immutable)
 */
export async function updatePolicy(
  id: string,
  data: UpdatePolicyRequest
): Promise<Policy> {
  const res = await apiClient.put<SuccessResponse<Policy>>(
    `/policies/${id}`,
    data
  );
  
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<Policy>).data;
  }
  return res.data as Policy;
}

/**
 * Activate a policy (deactivates all others)
 */
export async function activatePolicy(id: string): Promise<Policy> {
  const res = await apiClient.patch<SuccessResponse<Policy>>(
    `/policies/${id}/activate`
  );
  
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<Policy>).data;
  }
  return res.data as Policy;
}

/**
 * Deactivate a policy
 */
export async function deactivatePolicy(id: string): Promise<Policy> {
  const res = await apiClient.patch<SuccessResponse<Policy>>(
    `/policies/${id}/deactivate`
  );
  
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<Policy>).data;
  }
  return res.data as Policy;
}

/**
 * Delete a policy (cannot delete if active)
 */
export async function deletePolicy(id: string): Promise<void> {
  await apiClient.delete(`/policies/${id}`);
}
