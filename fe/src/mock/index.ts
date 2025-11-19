/**
 * Mock API bootstrapper.
 *
 * Only runs in development mode.
 * You can expand this for other domain mocks later (user, document...).
 */

import { setupMockContactAdmin } from "./contact-admin";
import { setupMockAuth } from "./auth";
import { setupMockProfile } from "./profile";
import { setupMockNotification } from "./notification";
import { setupMockManageOrganization } from "./manageOrganization";
import { setupMockOrganizations } from "./organizations";
import { setupMockDocuments } from "./uploadDocuments";
import { setupMockManageTags } from "./manageTags";
import { setupMockManageDomains } from "./manageDomains";
import { setupMockManageTypes } from "./manageTypes";

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
}
