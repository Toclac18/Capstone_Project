import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Home",
        icon: Icons.HomeIcon,
        url: "/",
      },
      {
        title: "Template",
        icon: Icons.FourCircle,
        items: [
          {
            title: "Form Elements",
            url: "/forms/form-elements",
          },
          {
            title: "Form Layout",
            url: "/forms/form-layout",
          },
          {
            title: "Tables",
            url: "/tables",
          },
          {
            title: "Basic Chart",
            url: "/charts/basic-chart",
          },
          {
            title: "Alerts",
            url: "/ui-elements/alerts",
          },
          {
            title: "Buttons",
            url: "/ui-elements/buttons",
          },
        ],
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
        title: "My Organizations List",
        icon: Icons.BuildingIcon,
        url: "/reader/organizations",
      },
      {
        title: "Search Document",
        icon: Icons.SearchIcon,
        url: "/search",
      },
      {
        title: "Upload History",
        icon: Icons.HistoryIcon,
        url: "/reader/upload-history",
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
    ],
  },
];

// Reviewer menu
export const REVIEWER_NAV_DATA = [
  {
    label: "REVIEWER",
    items: [
      {
        title: "View Review List",
        icon: Icons.ClipboardCheckIcon,
        url: "/reviewer/review-list",
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
        icon: Icons.BarChartIcon,
        url: "/business-admin/reports",
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
