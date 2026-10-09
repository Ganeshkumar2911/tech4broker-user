import FmLayout from "@/layouts/fm/FmLayout.vue";

export const fmRoutes = [
  {
    path: "/register-fm",
    name: "register-fm",
    component: () => import("@/pages/fm/registration/index.vue"),
    meta: {
      role: "fm",
      title: "Register Fund Manager",
      description: "Set up the fund manager's account, fees, settlement rules, and visibility preferences.",
    },
  },
  {
    path: "/",
    component: FmLayout,
    meta: { role: "fm" },
    children: [
      {
        path: "fm-dashboard",
        component: () => import("@/pages/fm/dashboard/Layout.vue"),
        meta: {
          title: "FM Dashboard",
          description: "Overview of your trading performance and account status.",
        },
        children: [
          {
            path: "",
            name: "fm-dashboard",
            component: () => import("@/pages/fm/dashboard/FundManagerDashboard.vue"),
          },
          {
            path: "fm-offers",
            name: "fm-offers",
            component: () => import("@/pages/fm/offers/index.vue"),
            meta: {
              title: "FM Offers",
              description: "Manage subscription conditions and offers for followers.",
              showBackButton: true,
              backPath: "/fm-dashboard",
            },
          },
          {
            path: "fm-offers/:id",
            name: "fm-offer-details",
            component: () => import("@/pages/fm/offers/links.vue"),
            meta: {
              title: "Offer Links & Details",
              description: "Manage offer join links and agent commission shares.",
              showBackButton: true,
            },
          },
        ],
      },
      {
        path: "fm-strategies",
        name: "fm-strategies",
        component: () => import("@/pages/fm/strategies/index.vue"),
        meta: {
          title: "My Strategies",
          description: "Manage and switch between your fund manager strategies.",
        },
      },
      {
        path: "fm-requests",
        name: "fm-requests",
        component: () => import("@/pages/fm/requests/index.vue"),
        meta: {
          title: "Strategy Requests",
          description: "Track and submit fund manager strategy applications.",
        },
      },
      {
        path: "fm-trading-accounts",
        component: () => import("@/pages/fm/trading-accounts/Layout.vue"),
        meta: {
          title: "FM Trading Accounts",
          description: "Overview of your fund manager Trading Accounts.",
        },
        children: [
          {
            path: "",
            name: "fm-trading-accounts",
            component: () => import("@/pages/fm/trading-accounts/index.vue"),
          },
          {
            path: "trades/:id",
            name: "fm-account-trades",
            component: () => import("@/pages/fm/trading-accounts/trades.vue"),
            meta: {
              title: "FM Trades",
              description: "View FM account trades.",
              showBackButton: true,
            },
          },
          {
            path: "transactions/:id",
            name: "fm-account-transactions",
            component: () => import("@/pages/fm/trading-accounts/transactions.vue"),
            meta: {
              title: "FM Transactions",
              description: "View FM account transactions.",
              showBackButton: true,
            },
          },
        ],
      },
      {
        path: "fm-funds",
        name: "fm-funds",
        component: () => import("@/pages/shared/funds/index.vue"),
        meta: {
          title: "Funds",
          description: "View and manage your funds.",
        },
      },
      {
        path: "fm-leaderboard",
        name: "fm-leaderboard",
        component: () => import("@/pages/fm/leaderboard/index.vue"),
        meta: {
          title: "Leaderboard",
          description: "Explore top fund managers and strategy performance.",
        },
      },
      {
        path: "fm-trade-books",
        name: "fm-trade-books",
        component: () => import("@/pages/fm/trade-books/index.vue"),
        meta: {
          title: "My Trade Books",
          description: "View master trades for your Fund Manager account.",
        },
      },
      {
        path: "followers",
        component: () => import("@/pages/fm/followers/Layout.vue"),
        meta: {
          title: "Followers",
          description: "View and manage all followers assigned through your offers.",
        },
        children: [
          {
            path: "",
            name: "followers",
            component: () => import("@/pages/fm/followers/index.vue"),
          },
          {
            path: "trades/:id",
            name: "follower-trades",
            component: () => import("@/pages/fm/followers/trades.vue"),
            meta: {
              title: "Follower Trades",
              description: "View trades for follower account.",
              showBackButton: true,
            },
          },
          {
            path: "info/:id",
            name: "follower-info",
            component: () => import("@/pages/fm/followers/details.vue"),
            meta: {
              title: "Follower Details",
              description: "View details of the follower account.",
              showBackButton: true,
            },
          },
        ],
      },
      {
        path: "your-wallet",
        name: "your-wallet",
        component: () => import("@/pages/fm/your-wallet/index.vue"),
        meta: {
          title: "Your Wallet",
          description: "View and manage your wallet.",
        },
      },
      {
        path: "fm-settlements",
        component: () => import("@/pages/fm/settlements/Layout.vue"),
        meta: {
          title: "Settlements",
          description: "View and run your settlements.",
        },
        children: [
          {
            path: "",
            name: "fm-settlements",
            component: () => import("@/pages/fm/settlements/index.vue"),
          },
          {
            path: ":id",
            name: "fm-settlement-detail",
            component: () => import("@/pages/fm/settlements/detail.vue"),
            meta: {
              title: "Settlement Details",
              description: "View settlement details.",
              showBackButton: true,
            },
          },
          {
            path: ":id/user/:user_id",
            name: "fm-settlement-user",
            component: () => import("@/pages/fm/settlements/user.vue"),
            meta: {
              title: "User Settlement",
              description: "View user settlement details.",
              showBackButton: true,
            },
          },
          {
            path: "trades/:id",
            name: "fm-settlement-trades",
            component: () => import("@/pages/fm/settlements/trades.vue"),
            meta: {
              title: "Settlement Trades",
              description: "View settlement trades.",
              showBackButton: true,
            },
          }
        ],
      },
      {
        path: "fm-tickets",
        name: "fm-tickets",
        component: () => import("@/pages/shared/tickets/index.vue"),
        meta: {
          title: "Support Tickets",
          description: "Raise and manage support tickets.",
        },
      },
      {
        path: "fm-tickets/:id",
        name: "fm-ticket-detail",
        component: () => import("@/pages/shared/tickets/TicketDetail.vue"),
        meta: {
          title: "Ticket Details",
          description: "View and respond to support ticket.",
          showBackButton: true,
          backPath: "/fm-tickets",
        },
      },
    ],
  },
];
