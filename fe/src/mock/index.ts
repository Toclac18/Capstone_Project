/**
 * Mock API bootstrapper.
 *
 * Only runs in development mode.
 * You can expand this for other domain mocks later (user, document...).
 */

import { setupMockContactAdmin } from "./contact-admin";
import { setupMockAuth } from "./auth";
import { setupMockNotification } from "./notification";

export function setupMocks() {
  if (process.env.NODE_ENV !== "development") return;

  console.info("[MOCK] Starting mock API handlers...");
  setupMockAuth();
  setupMockContactAdmin();
  setupMockNotification();
}
