import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        url: "/admin/dashboard",
        items: [],
      },
      {
        title: "Profile",
        url: "/profile",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Change Profile",
        url: "/change-profile",
        icon: Icons.Alphabet,
        items: [],
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

export const BUSINESS_ADMIN_NAV_DATA = [
  {
    label: "BUSINESS ADMIN",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        url: "/business-admin",
        items: [],
      },
      {
        title: "User Management",
        icon: Icons.User,
        url: "/business-admin/users",
        items: [],
      },
      {
        title: "Organization Management",
        icon: Icons.BuildingIcon,
        url: "/business-admin/organization",
        items: [],
      },
      {
        title: "Documents Management",
        icon: Icons.FileTextIcon,
        url: "/business-admin/document",
        items: [],
      },
      {
        title: "Reports",
        icon: Icons.FourCircle,
        url: "/business-admin/reports",
        items: [],
      },
      {
        title: "Settings",
        icon: Icons.Alphabet,
        url: "/business-admin/settings",
        items: [],
      },
    ],
  },
];