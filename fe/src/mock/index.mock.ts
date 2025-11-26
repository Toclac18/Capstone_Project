/**
 * Mock API bootstrapper.
 *
 * Only runs in development mode.
 * You can expand this for other domain mocks later (user, document...).
 */

import { setupMockContactAdmin } from "./contact-admin.mock";
import { setupMockAuth } from "./auth.mock";
import { setupMockProfile } from "./profile.mock";
import { setupMockNotification } from "./notification.mock";
import { setupMockManageOrganization } from "./manage-organization.mock";
import { setupMockOrganizations } from "./organizations.mock";
import { setupMockDocuments } from "./upload-documents.mock";
import { setupMockManageTags } from "./manage-tags.mock";
import { setupMockManageDomains } from "./manage-domains.mock";
import { setupMockManageTypes } from "./manage-types.mock";
import { setupMockManageSpecializations } from "./manage-specializationsMock";

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
