import AuthLayout from "@/layouts/auth.vue";

export const authRoutes = [
  {
    path: "",
    component: AuthLayout,
    children: [
      {
        path: "/login/user",
        alias: ["/secret-login", "/login/secret"],
        name: "login-user",
        component: () => import("@/pages/new-auth/secret-login.vue"),
      },
      {
        path: "/login/:userType?",
        alias: [
          "/auto-login",
          "/auto-login/:userType?",
          "/fm-login",
          "/fund-manager/login",
        ],
        name: "login",
        component: () => import("@/pages/new-auth/login.vue"),
      },
      {
        path: "/dev-login",
        name: "dev-login",
        component: () => import("@/pages/new-auth/dev-login.vue"),
      },
      {
        path: "/register/:userType?",
        alias: [
          "/fm-register",
          "/fund-manager/register",
        ],
        name: "register",
        component: () => import("@/pages/new-auth/register.vue"),
      },
      {
        path: "/forgot-password",
        alias: ["/forgot"],
        name: "forgot-password",
        component: () => import("@/pages/new-auth/forgot-password.vue"),
      },
      {
        path: "/reset-password",
        name: "reset-password",
        component: () => import("@/pages/new-auth/reset-password.vue"),
      },
      {
        path: "/two-factor",
        alias: [
          "/2fa",
          "/two-factor-auth",
          "/verify-2fa",
          "/login/2fa",
          "/login-2fa",
        ],
        name: "two-factor",
        component: () => import("@/pages/new-auth/two-factor.vue"),
      },
      {
        path: "/join/:token",
        alias: ["/login/join/:token"],
        name: "join-offer",
        component: () => import("@/pages/join-offer/index.vue"),
      },
    ],
  },
];
