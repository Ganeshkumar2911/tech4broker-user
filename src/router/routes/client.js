import ClientLayout from "@/layouts/client/ClientLayout.vue";

export const clientRoutes = [
  {
    path: "/",
    component: ClientLayout,
    meta: { role: "client" },
    children: [
      {
        path: "dashboard",
        name: "dashboard",
        component: () => import("@/pages/client/dashboard/ClientDashboard.vue"),
        meta: {
          title: "Dashboard",
          // description: "Overview of your trading performance and account status.",
        },
      },
      {
        path: "trading-accounts",
        component: () => import("@/pages/client/trading-accounts/Layout.vue"),
        meta: {
          title: "Trading Accounts",
          // description: "Manage your trading accounts and view performance metrics.",
        },
        children: [
          {
            path: "",
            name: "trading-accounts",
            component: () =>
              import("@/pages/client/trading-accounts/index.vue"),
          },
          {
            path: "trades/:id",
            name: "account-trades",
            component: () =>
              import("@/pages/client/trading-accounts/trades.vue"),
            meta: {
              title: "Trades",
              description: "View account trades.",
              showBackButton: true,
            },
          },
          {
            path: "transactions/:id",
            name: "account-transactions",
            component: () =>
              import("@/pages/client/trading-accounts/transactions.vue"),
            meta: {
              title: "Transactions",
              description: "View account transactions.",
              showBackButton: true,
            },
          },
        ],
      },
      {
        path: "funds",
        name: "funds",
        component: () => import("@/pages/shared/funds/index.vue"),
        meta: {
          title: "Funds",
          // description: "View and manage your client wallet.",
        },
      },
      {
        path: "trading-reports",
        name: "trading-reports",
        component: () => import("@/pages/client/trading-reports/index.vue"),
        meta: {
          title: "Trading Reports",
          description: "View and manage your trading reports.",
        },
      },
      {
        path: "mtrading",
        name: "mtrading",
        component: () => import("@/pages/client/copy-trading/index.vue"),
        meta: {
          title: "Trading",
          description:
            "Explore leading Fund Managers and manage your active copies.",
        },
      },
      {
        path: "copy-trading",
        component: () => import("@/pages/client/copy-trading/Layout.vue"),
        meta: {
          title: "Copy Trading",
          description:
            "Explore leading Fund Managers and manage your active copies.",
        },
        children: [
          {
            path: "",
            name: "copy-trading",
            component: () => import("@/pages/client/copy-trading/index.vue"),
          },
          {
            path: "copy-trading-profile/:id",
            name: "copy-trading-profile",
            component: () => import("@/pages/client/copy-trading/profile.vue"),
            meta: {
              title: "Copy Trading Profile",
              description: "View fund manager profile.",
              showBackButton: true,
            },
          },
          {
            path: "trade-book/:id",
            name: "follower-trade-book",
            component: () =>
              import("@/pages/client/copy-trading/tradeBook.vue"),
            meta: {
              title: "Follower Trade Book",
              description:
                "View detailed trade book, deals, positions, and orders for follower.",
              showBackButton: true,
            },
          },
          {
            path: "fm-analysis/:id",
            name: "copy-trading-fm-analysis",
            component: () => import("@/pages/fm/leaderboard/analysis.vue"),
            meta: {
              title: "FM Analysis",
              description: "View detailed FM analysis.",
              showBackButton: true,
            },
          },
        ],
      },
      {
        path: "followed-fund-managers/trade-book/:id",
        component: () => import("@/pages/client/copy-trading/tradeBook.vue"),
        meta: {
          title: "Follower Trade Book",
          description:
            "View detailed trade book, deals, positions, and orders for follower.",
          showBackButton: true,
        },
      },
      {
        path: "cashback",
        name: "cashback",
        component: () => import("@/pages/client/cashback/index.vue"),
        meta: {
          requiresAuth: true,
          title: "Cashback Program",
          description: "Earn and manage USD cashback on your trades.",
          featureName: "Cashback Program",
          allowedRoles: ["client"],
        },
      },
      {
        path: "loyalty-program",
        name: "loyalty-program",
        component: () => import("@/pages/loyalty-program/index.vue"),
        meta: {
          requiresAuth: true,
          title: "Loyalty Program",
          description:
            "Track your loyalty points, tier progression, and rewards.",
          featureName: "Loyalty Program",
          allowedRoles: ["client"],
        },
      },
      {
        path: "tickets",
        name: "tickets",
        component: () => import("@/pages/shared/tickets/index.vue"),
        meta: {
          title: "Support Tickets",
          description: "Raise a ticket to connect with our support team.",
        },
      },
      {
        path: "tickets/:id",
        name: "ticket-detail",
        component: () => import("@/pages/shared/tickets/TicketDetail.vue"),
        meta: {
          title: "Ticket Details",
          description: "View and respond to support ticket.",
          showBackButton: true,
          backPath: "/tickets",
        },
      },

    ],
  },
];
