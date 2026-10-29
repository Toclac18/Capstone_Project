// server/route-map.ts
//
// Bảng route của lớp BFF: FE path -> BE path. Một dòng thay cho một file
// route.ts trước đây chỉ làm đúng việc chuyển tiếp.
//
// SINH TỪ các route handler cũ, không gõ tay. Thêm route mới thì thêm một dòng;
// route cần biến đổi dữ liệu thì vẫn viết file riêng trong app/api/ —
// Next.js ưu tiên route cụ thể hơn catch-all.
//
// `public: true` nghĩa là KHÔNG gắn Authorization; chỉ dùng cho endpoint
// nằm trong permitAll() của SecurityConfig phía BE.

import type { RouteSpec } from "@/server/route-types";

export const ROUTES: readonly RouteSpec[] = [
  // ── auth ──
  { fe: "auth/resend-verification-email", be: "auth/resend-verification-email", methods: ["POST"], public: true },
  { fe: "auth/verify-email", be: "auth/verify-email", methods: ["POST"], public: true },
  { fe: "auth/register/reader", be: "auth/register/reader", methods: ["POST"], public: true },

  // ── business-admin ──
  { fe: "business-admin/reports", be: "reports", methods: ["GET"] },
  { fe: "business-admin/review-results", be: "admin/review-results", methods: ["GET"] },
  { fe: "business-admin/tickets", be: "contact-tickets", methods: ["GET"] },
  { fe: "business-admin/domains/:id", be: "admin/domains/:id", methods: ["PUT"] },
  { fe: "business-admin/reports/:id", be: "reports/:id", methods: ["GET", "PUT"] },
  { fe: "business-admin/review-results/pending", be: "admin/review-results/pending", methods: ["GET"] },
  { fe: "business-admin/specializations/:id", be: "admin/specializations/:id", methods: ["PUT"] },
  { fe: "business-admin/tickets/:ticketId", be: "contact-tickets/:ticketId", methods: ["GET", "PATCH"] },
  { fe: "business-admin/types/:id", be: "admin/doc-types/:id", methods: ["PUT"] },
  { fe: "business-admin/documents/:documentId/activate", be: "admin/documents/:documentId/activate", methods: ["PATCH"] },
  { fe: "business-admin/documents/:documentId/deactivate", be: "admin/documents/:documentId/deactivate", methods: ["PATCH"] },
  { fe: "business-admin/documents/:documentId/status", be: "admin/documents/:documentId/status", methods: ["PATCH"] },
  { fe: "business-admin/review-results/:reviewId/approve", be: "admin/review-results/:reviewId/approve", methods: ["PUT"] },

  // ── comments ──
  { fe: "comments/:id", be: "comments/:id", methods: ["PUT", "DELETE"] },

  // ── contact-admin ──
  { fe: "contact-admin", be: "contact-tickets", methods: ["POST"], public: true },

  // ── contact-tickets ──
  { fe: "contact-tickets/:ticketId", be: "contact-tickets/:ticketId", methods: ["GET"] },
  { fe: "contact-tickets/code/:ticketCode", be: "contact-tickets/code/:ticketCode", methods: ["GET"] },

  // ── docs-view ──
  { fe: "docs-view/:id", be: "documents/:id", methods: ["GET"] },
  { fe: "docs-view/:id/presigned-url", be: "documents/:id/presigned-url", methods: ["GET"] },
  { fe: "docs-view/:id/redeem", be: "documents/:id/redeem", methods: ["POST"] },

  // ── document-report ──
  { fe: "document-report", be: "reports", methods: ["POST"] },

  // ── documents ──
  { fe: "documents/:id", be: "documents/:id", methods: ["GET"] },
  { fe: "documents/read-history", be: "documents/read-history", methods: ["GET"] },

  // ── homepage ──
  { fe: "homepage/trending-documents", be: "statistics/homepage/trending-documents", methods: ["GET"], public: true },
  { fe: "homepage/trending-reviewers", be: "statistics/homepage/trending-reviewers", methods: ["GET"], public: true },

  // ── notifications ──
  { fe: "notifications/read-all", be: "notifications/read-all", methods: ["PATCH"] },
  { fe: "notifications/:id/read", be: "notifications/:id/read", methods: ["PATCH"] },

  // ── org-admin ──
  { fe: "org-admin/documents", be: "organization/documents", methods: ["GET"] },
  { fe: "org-admin/profile", be: "organization/profile", methods: ["GET", "PUT"] },
  { fe: "org-admin/readers", be: "organization/members", methods: ["GET"] },
  { fe: "org-admin/readers/invite", be: "organization/members/invite", methods: ["POST"] },

  // ── organizations ──
  { fe: "organizations", be: "organizations", methods: ["GET", "POST"] },
  { fe: "organizations/:id", be: "organizations/:id", methods: ["GET"] },
  { fe: "organizations/all", be: "organizations/all", methods: ["GET"] },
  { fe: "organizations/join", be: "organization/members/accept-invitation", methods: ["POST"] },
  { fe: "organizations/:id/status", be: "organizations/:id/status", methods: ["PATCH"] },

  // ── policies ──
  { fe: "policies/:id", be: "policies/:id", methods: ["GET", "PUT", "DELETE"] },
  { fe: "policies/active", be: "policies/active", methods: ["GET"], public: true },
  { fe: "policies/:id/activate", be: "policies/:id/activate", methods: ["PATCH"] },
  { fe: "policies/:id/deactivate", be: "policies/:id/deactivate", methods: ["PATCH"] },

  // ── profile ──
  { fe: "profile/change-email", be: "user/change-email", methods: ["POST"] },
  { fe: "profile/change-password", be: "user/change-password", methods: ["PUT"] },
  { fe: "profile/delete-account", be: "user/account", methods: ["DELETE"] },
  { fe: "profile/verify-email-change", be: "user/verify-email-change", methods: ["POST"] },
  { fe: "profile/verify-password-for-email-change", be: "user/verify-password-for-email-change", methods: ["POST"] },

  // ── reader ──
  { fe: "reader/profile", be: "reader/profile", methods: ["GET", "PUT"] },
  { fe: "reader/enrollments/invitations", be: "reader/enrollments/invitations", methods: ["GET"] },
  { fe: "reader/organizations/:id", be: "public/organizations/:id", methods: ["GET"] },
  { fe: "reader/documents/:id/review-result", be: "documents/:id/review-result", methods: ["GET"] },
  { fe: "reader/documents/:id/violations", be: "documents/:id/violations", methods: ["GET"] },
  { fe: "reader/enrollments/:enrollmentId/accept", be: "reader/enrollments/:enrollmentId/accept", methods: ["POST"] },
  { fe: "reader/enrollments/:enrollmentId/reject", be: "reader/enrollments/:enrollmentId/reject", methods: ["POST"] },
  { fe: "reader/organizations/:id/leave", be: "reader/enrollments/organizations/:id/leave", methods: ["POST"] },

  // ── reviewer ──
  { fe: "reviewer/profile", be: "reviewer/profile", methods: ["GET", "PUT"] },
  { fe: "reviewer/review-list", be: "review-requests", methods: ["GET"] },
  { fe: "reviewer/review-list/history", be: "review-requests/history", methods: ["GET"] },
  { fe: "reviewer/review-list/pending", be: "review-requests/pending", methods: ["GET"] },
  { fe: "reviewer/review-list/requests", be: "review-requests", methods: ["GET"] },
  { fe: "reviewer/review-list/todo", be: "review-requests/todo", methods: ["GET"] },

  // ── save-lists ──
  { fe: "save-lists", be: "save-lists", methods: ["GET", "POST"] },
  { fe: "save-lists/:id", be: "save-lists/:id", methods: ["GET", "PUT", "DELETE"] },
  { fe: "save-lists/:id/documents", be: "save-lists/:id/documents", methods: ["POST"] },
  { fe: "save-lists/:id/documents/:documentId", be: "save-lists/:id/documents/:documentId", methods: ["DELETE"] },

  // ── search ──
  { fe: "search", be: "documents/search", methods: ["POST"] },

  // ── system-admin ──
  { fe: "system-admin/configs", be: "system-admin/configs", methods: ["GET"] },
  { fe: "system-admin/configs/:key", be: "system-admin/configs/:key", methods: ["PUT"] },
  { fe: "system-admin/users/:id/role", be: "system-admin/users/:id/role", methods: ["PATCH"] },

  // ── users ──
  { fe: "users", be: "users", methods: ["GET", "POST"] },
  { fe: "users/:id/status", be: "users/:id/status", methods: ["PATCH"] },

] as const;
