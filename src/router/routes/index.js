import { authRoutes } from "./auth";
import { clientRoutes } from "./client";
import { ibRoutes } from "./ib";
import { fmRoutes } from "./fm";

export const commonRoutes = [
  {
    path: "/profile",
    name: "profile",
    component: () => import("@/pages/shared/profile/index.vue"),
    meta: {
      title: "Profile",
      description: "Manage your profile.",
    },
  },
  {
    path: "/fm-copy-trading-profile/:id",
    name: "copy-trading-fm-profile",
    component: () => import("@/pages/client/copy-trading/profile.vue"),
    meta: {
      title: "Profile",
      description: "Manage your profile.",
      showBackButton: true,
    },
  },
  {
    path: "/deposit-status",
    name: "deposit-status",
    component: () => import("@/pages/shared/funds/deposit-status.vue"),
    meta: {
      title: "Deposit Status",
      description: "Payment verification and status.",
    },
  },
  {
    path: "/chart-trading",
    component: () => import("@/pages/client/chart-trading/Layout.vue"),
    children: [
      {
        path: "",
        name: "chart-trading",
        component: () => import("@/pages/client/chart-trading/index.vue"),
        meta: {
          title: "Chart Trading",
          description: "Overview",
          showBackButton: false,
        },
      },
      {
        path: "market",
        name: "mobile-market",
        component: () => import("@/pages/client/chart-trading/mobile/MobileMarketViewModal.vue"),
        meta: {
          title: "Market",
          description: "Market Watchlist, Trades & History",
          showBackButton: true,
        },
      },
    ],
  },
];

const routes = [
  ...authRoutes,
  ...clientRoutes,
  ...ibRoutes,
  ...fmRoutes,
  ...commonRoutes,
];

export default routes;
