import type {
  PersonalDocumentStatistics,
  OrganizationStatistics,
  BusinessAdminDashboard,
  GlobalDocumentStatistics,
  ReportHandlingStatistics,
  TimeSeriesData,
  StatusBreakdown,
  PremiumBreakdown,
  VisibilityBreakdown,
  TopContributor,
  OrganizationBreakdown,
  TypeBreakdown,
  ReasonBreakdown,
  ResolutionTimeBreakdown,
} from "@/types/statistics";

// Generate mock time series data for the last 6 months
function generateTimeSeriesData(
  startDate: Date,
  endDate: Date,
  baseValue: number = 0,
  variance: number = 5
): TimeSeriesData[] {
  const data: TimeSeriesData[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    const count = Math.max(0, baseValue + Math.floor(Math.random() * variance));
    data.push({ date: dateStr, count });
    current.setDate(current.getDate() + 1);
  }

  return data;
}

// Generate mock statistics data
export function mockGetPersonalStatistics(
  startDate?: string,
  endDate?: string
): PersonalDocumentStatistics {
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setMonth(defaultStart.getMonth() - 6);

  const start = startDate ? new Date(startDate) : defaultStart;
  const end = endDate ? new Date(endDate) : now;

  // Generate time series data with realistic patterns
  const documentUploads = generateTimeSeriesData(start, end, 2, 3);
  const documentViews = generateTimeSeriesData(start, end, 15, 20);
  const votesReceived = generateTimeSeriesData(start, end, 5, 8);
  const commentsReceived = generateTimeSeriesData(start, end, 2, 4);
  const documentsSaved = generateTimeSeriesData(start, end, 3, 5);

  // Calculate totals from time series
  const totalDocumentsUploaded = documentUploads.reduce((sum, d) => sum + d.count, 0);
  const totalViews = documentViews.reduce((sum, d) => sum + d.count, 0);
  const totalVotes = votesReceived.reduce((sum, d) => sum + d.count, 0);
  const totalComments = commentsReceived.reduce((sum, d) => sum + d.count, 0);
  const totalSaves = documentsSaved.reduce((sum, d) => sum + d.count, 0);

  // Calculate upvotes and downvotes (assume 80% upvotes, 20% downvotes)
  const totalUpvotes = Math.floor(totalVotes * 0.8);
  const totalDownvotes = totalVotes - totalUpvotes;

  // Mock purchases (redemptions)
  const totalPurchases = Math.floor(totalDocumentsUploaded * 0.3); // 30% of documents are premium and purchased

  const averageViewsPerDocument =
    totalDocumentsUploaded > 0 ? totalViews / totalDocumentsUploaded : 0;
  const averageVotesPerDocument =
    totalDocumentsUploaded > 0 ? totalVotes / totalDocumentsUploaded : 0;

  // Status breakdown
  const statusBreakdown: StatusBreakdown[] = [
    { status: "VERIFIED", count: Math.floor(totalDocumentsUploaded * 0.7) },
    { status: "VERIFYING", count: Math.floor(totalDocumentsUploaded * 0.2) },
    { status: "REJECTED", count: Math.floor(totalDocumentsUploaded * 0.1) },
  ];

  // Premium breakdown
  const premiumBreakdown: PremiumBreakdown = {
    premiumCount: Math.floor(totalDocumentsUploaded * 0.4),
    freeCount: totalDocumentsUploaded - Math.floor(totalDocumentsUploaded * 0.4),
  };

  return {
    summary: {
      totalDocumentsUploaded,
      totalViews,
      totalUpvotes,
      totalDownvotes,
      totalComments,
      totalSaves,
      totalPurchases,
      averageViewsPerDocument: Math.round(averageViewsPerDocument * 100) / 100,
      averageVotesPerDocument: Math.round(averageVotesPerDocument * 100) / 100,
    },
    documentUploads,
    documentViews,
    votesReceived,
    commentsReceived,
    documentsSaved,
    statusBreakdown,
    premiumBreakdown,
  };
}

// Generate mock organization statistics
export function mockGetOrganizationStatistics(
  startDate?: string,
  endDate?: string
): OrganizationStatistics {
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setMonth(defaultStart.getMonth() - 6);

  const start = startDate ? new Date(startDate) : defaultStart;
  const end = endDate ? new Date(endDate) : now;

  // Generate time series data
  const memberGrowth = generateTimeSeriesData(start, end, 1, 2);
  const documentUploads = generateTimeSeriesData(start, end, 5, 8);
  const documentViews = generateTimeSeriesData(start, end, 50, 80);
  const votesReceived = generateTimeSeriesData(start, end, 20, 30);
  const commentsReceived = generateTimeSeriesData(start, end, 10, 15);
  const documentsSaved = generateTimeSeriesData(start, end, 15, 25);

  // Calculate totals
  const totalMembers = 150 + Math.floor(Math.random() * 50);
  const totalDocuments = documentUploads.reduce((sum, d) => sum + d.count, 0);
  const totalViews = documentViews.reduce((sum, d) => sum + d.count, 0);
  const totalVotes = votesReceived.reduce((sum, d) => sum + d.count, 0);
  const totalComments = commentsReceived.reduce((sum, d) => sum + d.count, 0);
  const totalSaves = documentsSaved.reduce((sum, d) => sum + d.count, 0);
  const totalPurchases = Math.floor(totalDocuments * 0.25);

  const totalUpvotes = Math.floor(totalVotes * 0.75);
  const totalDownvotes = totalVotes - totalUpvotes;
  const activeMembers = Math.floor(totalMembers * 0.6);
  const averageViewsPerDocument =
    totalDocuments > 0 ? totalViews / totalDocuments : 0;

  // Member status breakdown
  const memberStatusBreakdown: StatusBreakdown[] = [
    { status: "JOINED", count: Math.floor(totalMembers * 0.85) },
    { status: "PENDING_INVITE", count: Math.floor(totalMembers * 0.1) },
    { status: "REMOVED", count: Math.floor(totalMembers * 0.05) },
  ];

  // Document status breakdown
  const documentStatusBreakdown: StatusBreakdown[] = [
    { status: "VERIFIED", count: Math.floor(totalDocuments * 0.7) },
    { status: "VERIFYING", count: Math.floor(totalDocuments * 0.2) },
    { status: "REJECTED", count: Math.floor(totalDocuments * 0.1) },
  ];

  // Document visibility breakdown
  const documentVisibilityBreakdown: VisibilityBreakdown[] = [
    { visibility: "PUBLIC", count: Math.floor(totalDocuments * 0.5) },
    { visibility: "INTERNAL", count: Math.floor(totalDocuments * 0.4) },
    { visibility: "PRIVATE", count: Math.floor(totalDocuments * 0.1) },
  ];

  // Premium breakdown
  const premiumBreakdown: PremiumBreakdown = {
    premiumCount: Math.floor(totalDocuments * 0.35),
    freeCount: totalDocuments - Math.floor(totalDocuments * 0.35),
  };

  // Top contributors
  const topContributors: TopContributor[] = [
    {
      memberId: "1",
      memberName: "John Doe",
      memberEmail: "john.doe@example.com",
      uploadCount: 45,
    },
    {
      memberId: "2",
      memberName: "Jane Smith",
      memberEmail: "jane.smith@example.com",
      uploadCount: 38,
    },
    {
      memberId: "3",
      memberName: "Bob Johnson",
      memberEmail: "bob.johnson@example.com",
      uploadCount: 32,
    },
    {
      memberId: "4",
      memberName: "Alice Williams",
      memberEmail: "alice.williams@example.com",
      uploadCount: 28,
    },
    {
      memberId: "5",
      memberName: "Charlie Brown",
      memberEmail: "charlie.brown@example.com",
      uploadCount: 25,
    },
  ];

  return {
    organization: {
      id: "org-123",
      name: "Example Organization",
      type: "EDUCATIONAL",
      email: "org@example.com",
      createdAt: defaultStart.toISOString(),
    },
    summary: {
      totalMembers,
      totalDocuments,
      totalViews,
      totalUpvotes,
      totalDownvotes,
      totalComments,
      totalSaves,
      totalPurchases,
      activeMembers,
      averageViewsPerDocument: Math.round(averageViewsPerDocument * 100) / 100,
    },
    memberGrowth,
    documentUploads,
    documentViews,
    votesReceived,
    commentsReceived,
    documentsSaved,
    memberStatusBreakdown,
    documentStatusBreakdown,
    documentVisibilityBreakdown,
    premiumBreakdown,
    topContributors,
  };
}

// Generate mock Business Admin Dashboard
export function mockGetBusinessAdminDashboard(): BusinessAdminDashboard {
  return {
    overview: {
      totalDocuments: 1250,
      totalUsers: 450,
      totalOrganizations: 35,
      totalReports: 85,
      pendingReports: 12,
      activeUsers: 320,
      activeOrganizations: 28,
    },
    quickStats: {
      documentsToday: 15,
      documentsThisWeek: 95,
      documentsThisMonth: 380,
      reportsToday: 3,
      reportsThisWeek: 18,
      reportsThisMonth: 65,
      newUsersToday: 5,
      newUsersThisWeek: 32,
      newUsersThisMonth: 125,
    },
  };
}

// Generate mock Global Document Statistics
export function mockGetGlobalDocumentStatistics(
  startDate?: string,
  endDate?: string
): GlobalDocumentStatistics {
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setMonth(defaultStart.getMonth() - 6);

  const start = startDate ? new Date(startDate) : defaultStart;
  const end = endDate ? new Date(endDate) : now;

  const documentUploads = generateTimeSeriesData(start, end, 10, 15);
  const documentViews = generateTimeSeriesData(start, end, 200, 300);
  const votesReceived = generateTimeSeriesData(start, end, 80, 120);
  const commentsReceived = generateTimeSeriesData(start, end, 40, 60);
  const documentsSaved = generateTimeSeriesData(start, end, 60, 90);
  const documentsPurchased = generateTimeSeriesData(start, end, 20, 35);

  const totalDocuments = documentUploads.reduce((sum, d) => sum + d.count, 0);
  const totalViews = documentViews.reduce((sum, d) => sum + d.count, 0);
  const totalVotes = votesReceived.reduce((sum, d) => sum + d.count, 0);
  const totalComments = commentsReceived.reduce((sum, d) => sum + d.count, 0);
  const totalSaves = documentsSaved.reduce((sum, d) => sum + d.count, 0);
  const totalPurchases = documentsPurchased.reduce((sum, d) => sum + d.count, 0);

  const totalUpvotes = Math.floor(totalVotes * 0.75);
  const totalDownvotes = totalVotes - totalUpvotes;

  const averageViewsPerDocument =
    totalDocuments > 0 ? totalViews / totalDocuments : 0;
  const averageVotesPerDocument =
    totalDocuments > 0 ? totalVotes / totalDocuments : 0;

  const statusBreakdown: StatusBreakdown[] = [
    { status: "VERIFIED", count: Math.floor(totalDocuments * 0.7) },
    { status: "VERIFYING", count: Math.floor(totalDocuments * 0.2) },
    { status: "REJECTED", count: Math.floor(totalDocuments * 0.1) },
  ];

  const visibilityBreakdown: VisibilityBreakdown[] = [
    { visibility: "PUBLIC", count: Math.floor(totalDocuments * 0.6) },
    { visibility: "INTERNAL", count: Math.floor(totalDocuments * 0.3) },
    { visibility: "PRIVATE", count: Math.floor(totalDocuments * 0.1) },
  ];

  const premiumBreakdown: PremiumBreakdown = {
    premiumCount: Math.floor(totalDocuments * 0.3),
    freeCount: totalDocuments - Math.floor(totalDocuments * 0.3),
  };

  const organizationBreakdown: OrganizationBreakdown[] = [
    { organizationId: "1", organizationName: "Organization A", documentCount: 245 },
    { organizationId: "2", organizationName: "Organization B", documentCount: 189 },
    { organizationId: "3", organizationName: "Organization C", documentCount: 156 },
    { organizationId: "4", organizationName: "Organization D", documentCount: 134 },
    { organizationId: "5", organizationName: "Organization E", documentCount: 98 },
  ];

  const typeBreakdown: TypeBreakdown[] = [
    { typeId: "1", typeName: "Research Paper", count: 320 },
    { typeId: "2", typeName: "Technical Report", count: 280 },
    { typeId: "3", typeName: "Case Study", count: 195 },
    { typeId: "4", typeName: "White Paper", count: 165 },
    { typeId: "5", typeName: "Article", count: 120 },
  ];

  return {
    summary: {
      totalDocuments,
      totalViews,
      totalUpvotes,
      totalDownvotes,
      totalComments,
      totalSaves,
      totalPurchases,
      totalOrganizations: 35,
      totalUploaders: 280,
      averageViewsPerDocument: Math.round(averageViewsPerDocument * 100) / 100,
      averageVotesPerDocument: Math.round(averageVotesPerDocument * 100) / 100,
    },
    documentUploads,
    documentViews,
    votesReceived,
    commentsReceived,
    documentsSaved,
    documentsPurchased,
    statusBreakdown,
    visibilityBreakdown,
    premiumBreakdown,
    organizationBreakdown,
    typeBreakdown,
  };
}

// Generate mock Report Handling Statistics
export function mockGetReportHandlingStatistics(
  startDate?: string,
  endDate?: string
): ReportHandlingStatistics {
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setMonth(defaultStart.getMonth() - 6);

  const start = startDate ? new Date(startDate) : defaultStart;
  const end = endDate ? new Date(endDate) : now;

  const reportsCreated = generateTimeSeriesData(start, end, 2, 4);
  const reportsResolved = generateTimeSeriesData(start, end, 1, 3);
  const reportsRejected = generateTimeSeriesData(start, end, 0, 1);

  const totalReports = reportsCreated.reduce((sum, d) => sum + d.count, 0);
  const resolvedReports = reportsResolved.reduce((sum, d) => sum + d.count, 0);
  const rejectedReports = reportsRejected.reduce((sum, d) => sum + d.count, 0);

  const statusBreakdown: StatusBreakdown[] = [
    { status: "PENDING", count: 12 },
    { status: "IN_REVIEW", count: 8 },
    { status: "RESOLVED", count: Math.floor(totalReports * 0.6) },
    { status: "REJECTED", count: rejectedReports },
    { status: "CLOSED", count: Math.floor(totalReports * 0.15) },
  ];

  const reasonBreakdown: ReasonBreakdown[] = [
    { reason: "INAPPROPRIATE_CONTENT", count: 25 },
    { reason: "COPYRIGHT_VIOLATION", count: 18 },
    { reason: "SPAM", count: 12 },
    { reason: "MISLEADING_INFORMATION", count: 15 },
    { reason: "DUPLICATE_CONTENT", count: 8 },
    { reason: "QUALITY_ISSUES", count: 5 },
    { reason: "OTHER", count: 2 },
  ];

  const resolutionTimeBreakdown: ResolutionTimeBreakdown[] = [
    { timeRange: "< 24 hours", count: Math.floor(resolvedReports * 0.4) },
    { timeRange: "1-3 days", count: Math.floor(resolvedReports * 0.45) },
    { timeRange: "> 3 days", count: Math.floor(resolvedReports * 0.15) },
  ];

  return {
    summary: {
      totalReports,
      pendingReports: 12,
      inReviewReports: 8,
      resolvedReports,
      rejectedReports,
      closedReports: Math.floor(totalReports * 0.15),
      averageResolutionTime: 28.5, // hours
      totalReportsThisMonth: 18,
      totalReportsLastMonth: 15,
    },
    reportsCreated,
    reportsResolved,
    reportsRejected,
    statusBreakdown,
    reasonBreakdown,
    resolutionTimeBreakdown,
  };
}

