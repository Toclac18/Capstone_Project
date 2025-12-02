import { apiClient } from "./http";
import type {
  Policy,
  PolicyType,
  PolicyViewResponse,
  UpdatePolicyRequest,
} from "@/types/policy";

// BE response wrapper
interface SuccessResponse<T> {
  data: T;
  meta?: any;
}

/**
 * Get all policies (one per type)
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
 * Get active policy by type (for users to view)
 */
export async function getActivePolicyByType(
  type: PolicyType
): Promise<Policy> {
  const res = await apiClient.get<SuccessResponse<Policy>>(
    `/policies?type=${type}&active=true`
  );
  
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<Policy>).data;
  }
  return res.data as Policy;
}

/**
 * Get policy by ID with acceptance status (for users)
 */
export async function getPolicyView(
  id: string,
  userId?: string
): Promise<PolicyViewResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append("view", "true");
  if (userId) queryParams.append("userId", userId);

  const res = await apiClient.get<SuccessResponse<PolicyViewResponse>>(
    `/policies/${id}?${queryParams.toString()}`
  );
  
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<PolicyViewResponse>).data;
  }
  return res.data as PolicyViewResponse;
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
 * Update policy by type
 */
export async function updatePolicyByType(
  type: PolicyType,
  data: UpdatePolicyRequest
): Promise<Policy> {
  const res = await apiClient.patch<SuccessResponse<Policy>>(
    `/policies?type=${type}`,
    data
  );
  
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<Policy>).data;
  }
  return res.data as Policy;
}

/**
 * Accept policy (for users)
 */
export async function acceptPolicy(id: string): Promise<{ message: string }> {
  try {
    const res = await apiClient.post<SuccessResponse<{ message: string }>>(
      `/policies/${id}/accept`
    );
    
    // Backend returns 204 NO_CONTENT, axios may not parse body
    if (res.status === 204 || !res.data) {
      return { message: "Policy accepted successfully" };
    }
    
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      return (res.data as SuccessResponse<{ message: string }>).data;
    }
    return res.data as { message: string };
  } catch (error: any) {
    // If axios throws error but status is 204, it's actually success
    if (error?.response?.status === 204) {
      return { message: "Policy accepted successfully" };
    }
    throw error;
  }
}
