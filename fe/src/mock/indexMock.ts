/**
 * Mock API bootstrapper.
 *
 * Only runs in development mode.
 * You can expand this for other domain mocks later (user, document...).
 */

import { setupMockContactAdmin } from "./contactAdminMock";
import { setupMockAuth } from "./authMock";
import { setupMockProfile } from "./profileMock";
import { setupMockNotification } from "./notificationMock";
import { setupMockManageOrganization } from "./manageOrganizationMock";
import { setupMockOrganizations } from "./organizationsMock";
import { setupMockDocuments } from "./uploadDocumentsMock";
import { setupMockManageTags } from "./manageTagsMock";
import { setupMockManageDomains } from "./manageDomainsMock";
import { setupMockManageTypes } from "./manageTypesMock";
import { setupMockManageSpecializations } from "./manageSpecializationsMock";

export function setupMocks() {
  const enabled = process.env.NEXT_PUBLIC_USE_MOCK === "true";
  if (!enabled) return;

  console.info("[MOCK] Starting mock API handlers...");
  setupMockAuth();
  setupMockContactAdmin();
  setupMockProfile();
  setupMockNotification();
  setupMockManageOrganization();
  setupMockOrganizations();
  setupMockDocuments();
  setupMockManageTags();
  setupMockManageDomains();
  setupMockManageTypes();
  setupMockManageSpecializations();
}
