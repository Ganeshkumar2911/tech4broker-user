import IbLayout from "@/layouts/ib/IbLayout.vue";

export const ibRoutes = [
  {
    path: "/",
    component: IbLayout,
    meta: { role: "ib" },
    children: [
      {
        path: "ib-dashboard",
        name: "ib-dashboard",
        component: () => import("@/pages/ib/dashboard/IbDashboard.vue"),
        meta: {
          title: "IB Dashboard",
          description: "Overview of your IB performance and followers.",
        },
      },
      // {
      //   path: "ib-reports",
      //   name: "ib-reports",
      //   component: () => import("@/pages/ib/reports/index.vue"),
      // },
      {
        path: "ib-reports",
        name: "ib-reports",
        component: () => import("@/pages/ib/reports/IbReports.vue"),
        meta: {
          title: "IB Reports",
          description: "View and manage your IB reports.",
        },
      },
      {
        path: "client-network-report",
        name: "client-network-report",
        component: () => import("@/pages/ib/reports/IbReports.vue"),
        meta: {
          title: "Client Network Report",
          description: "View client network reports.",
          isClientMode: true,
          showBackButton: true,
          backPath: "/account-report",
        },
      },
      {
        path: "my-network",
        alias: ["/network", "/ib-tree", "/hierarchy"],
        name: "my-network",
        component: () => import("@/pages/ib/network/index.vue"),
        meta: {
          title: "My Network",
          description:
            "Overview of your network status performance and status.",
        },
      },
      {
        path: "network-analytics",
        name: "network-analytics",
        component: () => import("@/pages/ib/analytics/index.vue"),
        meta: {
          title: "Network Analytics",
          description:
            "Analyze your network growth, performance, and activity.",
        },
      },
      {
        path: "clients",
        alias: ["/client-report"],
        name: "clients",
        component: () => import("@/pages/ib/clients/ClientReport.vue"),
        meta: {
          title: "Clients",
          description: "Manage and review your client records.",
        },
      },
      {
        path: "account-report",
        name: "account-report",
        component: () => import("@/pages/ib/clients/AccountReport.vue"),
        meta: {
          title: "Account Report",
          description: "Manage and review client accounts.",
        },
      },
      {
        path: "clients/:id",
        name: "ib-client-detail",
        component: () => import("@/pages/ib/clients/ClientDetail.vue"),
        meta: {
          title: "Client Detail",
          description: "View detailed information for the selected client.",
          hideSidebar: true,
          showBackButton: true,
        },
      },
      {
        path: "account-report/client-details/:id",
        name: "account-report-client-detail",
        component: () => import("@/pages/ib/clients/ClientDetail.vue"),
        meta: {
          title: "Client Detail",
          description: "View detailed information for the selected client.",
          hideSidebar: true,
          showBackButton: true,
        },
      },
      {
        path: "ib-funds",
        name: "ib-funds",
        component: () => import("@/pages/shared/funds/index.vue"),
        meta: {
          title: "Funds",
          description: "View and manage your IB funds.",
        },
      },
      {
        path: "ib-wallet",
        name: "ib-wallet",
        component: () => import("@/pages/ib/wallet/index.vue"),
        meta: {
          title: "IB Wallet",
          description: "View and manage your IB wallet.",
        },
      },
      {
        path: "ib-tickets",
        name: "ib-tickets",
        component: () => import("@/pages/shared/tickets/index.vue"),
        meta: {
          title: "Support Tickets",
          description: "Raise and manage support tickets.",
        },
      },
      {
        path: "ib-tickets/:id",
        name: "ib-ticket-detail",
        component: () => import("@/pages/shared/tickets/TicketDetail.vue"),
        meta: {
          title: "Ticket Details",
          description: "View and respond to support ticket.",
          showBackButton: true,
          backPath: "/ib-tickets",
        },
      },
    ],
  },
];
