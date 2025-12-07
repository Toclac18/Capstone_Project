export interface SystemAdminDashboard {
  overview: {
    totalUsers: number;
    totalOrganizations: number;
    totalDocuments: number;
  };
  accessStatistics: {
    loginSuccessTrend: Array<{ date: string; count: number }>;
    loginFailedTrend: Array<{ date: string; count: number }>;
    activeUsersTrend: Array<{ date: string; count: number }>;
    totalLoginsToday: number;
    totalLoginsThisWeek: number;
    totalLoginsThisMonth: number;
    failedLoginsToday: number;
    failedLoginsThisWeek: number;
    failedLoginsThisMonth: number;
    activeUsersLast7Days: number;
    activeUsersLast30Days: number;
  };
  userActivity: {
    userGrowthByRole: Array<{
      role: string;
      growth: Array<{ date: string; count: number }>;
    }>;
    userStatusBreakdown: Array<{ status: string; count: number }>;
    newUsersRegistration: Array<{ date: string; count: number }>;
    totalReaders: number;
    totalReviewers: number;
    totalOrganizationAdmins: number;
    totalBusinessAdmins: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  };
  systemActivity: {
    documentsUploaded: Array<{ date: string; count: number }>;
    organizationsCreated: Array<{ date: string; count: number }>;
    systemActionsBreakdown: Array<{ action: string; count: number }>;
    systemActionsTrend: Array<{ date: string; count: number }>;
  };
}

