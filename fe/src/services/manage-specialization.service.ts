import { apiClient } from "./http";
import type {
  Specialization,
  SpecializationQueryParams,
  SpecializationResponse,
  CreateSpecializationRequest,
  UpdateSpecializationRequest,
} from "@/types/document-specialization";

/**
 * Get specializations by domain with pagination and filters
 */
export async function getSpecializations(
  params: SpecializationQueryParams
): Promise<SpecializationResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append("domainId", params.domainId);
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.limit) queryParams.append("limit", String(params.limit));
  if (params?.search) queryParams.append("search", params.search);

  const url = `/business-admin/specializations?${queryParams.toString()}`;
  const res = await apiClient.get<SpecializationResponse>(url);
  return res.data;
}

/**
 * Create a new specialization
 */
export async function createSpecialization(
  data: CreateSpecializationRequest
): Promise<Specialization> {
  const res = await apiClient.post<Specialization>("/business-admin/specializations", data);
  return res.data;
}

/**
 * Update an existing specialization
 */
export async function updateSpecialization(
  id: string,
  data: UpdateSpecializationRequest
): Promise<Specialization> {
  const res = await apiClient.put<Specialization>(`/business-admin/specializations/${id}`, data);
  return res.data;
}

