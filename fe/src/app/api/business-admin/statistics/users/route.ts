import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { jsonResponse } from "@/server/response";
import type { UserStatus } from "@/types/user";
import { getUsers as getMockUsers } from "@/mock/business-admin-users";

type RoleUserStats = {
  role: string;
  total: number;
  active: number;
  deactive: number;
  deleted: number;
  pendingVerification: number;
};

type UserStatistics = {
  summary: {
    totalUsers: number;
    activeUsers: number;
    deactiveUsers: number;
    deletedUsers: number;
    pendingVerificationUsers: number;
  };
  perRole: RoleUserStats[];
};

function aggregateUserStats(users: any[]): UserStatistics {
  const excludedRoles = new Set<string>(["SYSTEM_ADMIN", "BUSINESS_ADMIN"]);

  const relevantUsers = users.filter(
    (user) => user.role && !excludedRoles.has(user.role),
  );

  const summary = {
    totalUsers: 0,
    activeUsers: 0,
    deactiveUsers: 0,
    deletedUsers: 0,
    pendingVerificationUsers: 0,
  };

  const perRoleMap = new Map<
    string,
    {
      role: string;
      total: number;
      active: number;
      deactive: number;
      deleted: number;
      pendingVerification: number;
    }
  >();

  const getStatusKey = (status?: UserStatus | string) => {
    if (!status) return "unknown";
    if (status === "ACTIVE") return "active";
    if (status === "DEACTIVE" || status === "INACTIVE") return "deactive";
    if (status === "DELETED") return "deleted";
    if (status === "PENDING_VERIFICATION" || status === "PENDING_EMAIL_VERIFY") {
      return "pendingVerification";
    }
    return "unknown";
  };

  for (const user of relevantUsers) {
    const role = user.role || "UNKNOWN";
    const statusKey = getStatusKey(user.status);

    if (!perRoleMap.has(role)) {
      perRoleMap.set(role, {
        role,
        total: 0,
        active: 0,
        deactive: 0,
        deleted: 0,
        pendingVerification: 0,
      });
    }

    const roleStats = perRoleMap.get(role)!;
    roleStats.total += 1;

    switch (statusKey) {
      case "active":
        roleStats.active += 1;
        summary.activeUsers += 1;
        break;
      case "deactive":
        roleStats.deactive += 1;
        summary.deactiveUsers += 1;
        break;
      case "deleted":
        roleStats.deleted += 1;
        summary.deletedUsers += 1;
        break;
      case "pendingVerification":
        roleStats.pendingVerification += 1;
        summary.pendingVerificationUsers += 1;
        break;
      default:
        break;
    }

    summary.totalUsers += 1;
  }

  const perRole = Array.from(perRoleMap.values()).sort((a, b) =>
    a.role.localeCompare(b.role),
  );

  return {
    summary,
    perRole,
  };
}

async function handleGET() {
  if (USE_MOCK) {
    // Use mock business-admin users and aggregate by role & status
    const readers = getMockUsers({ page: 1, limit: 200 });
    const reviewers = getMockUsers({ page: 1, limit: 200 });
    const allUsers = [...readers.users, ...reviewers.users];

    const stats = aggregateUserStats(allUsers);

    return jsonResponse(stats, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const authHeaderReaders = await getAuthHeader("users");
  const authHeaderReviewers = await getAuthHeader("reviewers");

  const headersReaders = new Headers({
    "Content-Type": "application/json",
  });
  const headersReviewers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeaderReaders) {
    headersReaders.set("Authorization", authHeaderReaders);
  }
  if (authHeaderReviewers) {
    headersReviewers.set("Authorization", authHeaderReviewers);
  }

  const readersUrl = `${BE_BASE}/api/admin/readers?page=0&size=500`;
  const reviewersUrl = `${BE_BASE}/api/admin/reviewers?page=0&size=500`;

  const [readersRes, reviewersRes] = await Promise.all([
    fetch(readersUrl, {
      method: "GET",
      headers: headersReaders,
      cache: "no-store",
    }),
    fetch(reviewersUrl, {
      method: "GET",
      headers: headersReviewers,
      cache: "no-store",
    }),
  ]);

  const readersJson = readersRes.ok ? await readersRes.json() : { content: [] };
  const reviewersJson = reviewersRes.ok ? await reviewersRes.json() : { content: [] };

  const readers = readersJson?.content || readersJson?.data?.content || [];
  const reviewers = reviewersJson?.content || reviewersJson?.data?.content || [];

  const allUsers = [...readers, ...reviewers];

  const stats = aggregateUserStats(allUsers);

  return jsonResponse(stats, {
    status: 200,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

export async function GET(_request: Request) {
  return withErrorBoundary(() => handleGET(), {
    context: "api/business-admin/statistics/users/route.ts/GET",
  });
}


