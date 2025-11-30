import type {
  PersonalDocumentStatistics,
  OrganizationStatistics,
  TimeSeriesData,
  StatusBreakdown,
  PremiumBreakdown,
  VisibilityBreakdown,
  TopContributor,
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

