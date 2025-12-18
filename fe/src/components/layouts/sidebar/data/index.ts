import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Home",
        icon: Icons.HomeIcon,
        url: "/homepage",
      },
      {
        title: "Contact Admin",
        icon: Icons.HeadphonesIcon,
        url: "/contact-admin",
      },
    ],
  },
];

// Reader menu
export const READER_NAV_DATA = [
  {
    label: "READER",
    items: [
      {
        title: "Home",
        icon: Icons.HomeIcon,
        url: "/homepage",
      },
      {
        title: "Search Document",
        icon: Icons.SearchIcon,
        url: "/search",
      },
      {
        title: "My Organizations",
        icon: Icons.BuildingIcon,
        url: "/reader/organizations",
      },
      {
        title: "My Library",
        icon: Icons.BookIcon,
        url: "/reader/library",
      },
      {
        title: "My Statistics",
        icon: Icons.BarChartIcon,
        url: "/reader/statistics",
      },
      {
        title: "Upload History",
        icon: Icons.HistoryIcon,
        url: "/reader/upload-history",
      },
      {
        title: "Read History",
        icon: Icons.ClockIcon,
        url: "/reader/read-history",
      },     
      {
        title: "Contact Admin",
        icon: Icons.HeadphonesIcon,
        url: "/contact-admin",
      },
    ],
  },
];

// Reviewer menu
export const REVIEWER_NAV_DATA = [
  {
    label: "REVIEWER",
    items: [
      {
        title: "My Statistics",
        icon: Icons.BarChartIcon,
        url: "/reviewer/statistics",
      },
      {
        title: "View Review List",
        icon: Icons.ClipboardCheckIcon,
        url: "/reviewer/review-list",
      },
      {
        title: "Contact Admin",
        icon: Icons.HeadphonesIcon,
        url: "/contact-admin",
      },
    ],
  },
];

// Organization Admin menu
export const ORGANIZATION_ADMIN_NAV_DATA = [
  {
    label: "ORGANIZATION ADMIN",
    items: [
      {
        title: "Home",
        icon: Icons.HomeIcon,
        url: "/homepage",
      },
      {
        title: "Dashboard",
        icon: Icons.BarChartIcon,
        url: "/org-admin/statistics",
      },
      {
        title: "Organization Information",
        icon: Icons.BuildingIcon,
        url: "/org-admin/manage-organization",
      },
      {
        title: "Manage Reader",
        icon: Icons.UsersIcon,
        url: "/org-admin/readers",
      },
      {
        title: "Document Management",
        icon: Icons.FileTextIcon,
        url: "/org-admin/documents",
      },
      {
        title: "Import Readers Organization",
        icon: Icons.UploadIcon,
        url: "/org-admin/imports",
      },
    ],
  },
];

// Business Admin menu
export const BUSINESS_ADMIN_NAV_DATA = [
  {
    label: "BUSINESS ADMIN",
    items: [
      {
        title: "Dashboard",
        icon: Icons.BarChartIcon,
        url: "/business-admin/dashboard",
      },
      {
        title: "Organization Management",
        icon: Icons.BuildingIcon,
        url: "/business-admin/organization",
      },
      {
        title: "User Management",
        icon: Icons.UsersIcon,
        url: "/business-admin/users",
      },
      {
        title: "Document Management",
        icon: Icons.FileTextIcon,
        url: "/business-admin/document",
      },
      {
        title: "Review Management",
        icon: Icons.ClipboardCheckIcon,
        url: "/business-admin/reviews",
      },
      {
        title: "Review Approval",
        icon: Icons.CheckCircleIcon,
        url: "/business-admin/review-approval",
      },
      {
        title: "Document Domain Management",
        icon: Icons.FolderIcon,
        url: "/business-admin/domains",
      },
      {
        title: "Document Type Management",
        icon: Icons.FileTypeIcon,
        url: "/business-admin/types",
      },
      {
        title: "Document Tag Management",
        icon: Icons.TagIcon,
        url: "/business-admin/tags",
      },
      {
        title: "Report Management",
        icon: Icons.AlertTriangleIcon,
        url: "/business-admin/reports",
      },
      {
        title: "Contact Tickets",
        icon: Icons.HeadphonesIcon,
        url: "/business-admin/tickets",
      },
    ],
  },
];

// System Admin menu
export const SYSTEM_ADMIN_NAV_DATA = [
  {
    label: "SYSTEM ADMIN",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        url: "/admin/dashboard",
      },
      {
        title: "Role Management",
        icon: Icons.UsersIcon,
        url: "/admin/role-management",
      },
      {
        title: "System Logs",
        icon: Icons.ActivityIcon,
        url: "/admin/system-logs",
      },
      {
        title: "Policies",
        icon: Icons.FileTextIcon,
        url: "/admin/policies",
      },
      {
        title: "System Config",
        icon: Icons.SlidersIcon,
        url: "/admin/system-config",
      },
    ],
  },
];
