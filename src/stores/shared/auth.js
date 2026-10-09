import { ref, computed } from "vue";
import { defineStore } from "pinia";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import authToken from "@/common/authToken";
import { useSnackbarStore } from "@/stores/shared/snackbar";
import { useProfileStore } from "@/stores/shared/profile";
import { useLoaderStore } from "@/stores/shared/loader";
import { useThemeStore } from "@/stores/shared/theme";
import router from "@/router";

export const useAuthStore = defineStore("auth", () => {
  const snackbar = useSnackbarStore();
  const profileStore = useProfileStore();
  const loaderStore = useLoaderStore();
  const themeStore = useThemeStore();

  // ─── 1. Primary State ───────────────────────────────────────
  const token = ref(localStorage.getItem("accessToken") || null);
  const role = ref(localStorage.getItem("role") || "client");
  const user = ref(null);
  const twoFactorData = ref(null);

  // ─── 2. In-Flight Tracking (Prevents Parallel Duplicate Calls)
  const inFlight = {
    login: false,
    verifyLogin2fa: false,
    sendOtp: false,
    verifyOtp: false,
    register: false,
    forgotPassword: false,
    resetPassword: false,
    twoFactorStatus: false,
    twoFactorSetup: false,
    twoFactorConfirm: false,
    twoFactorDisable: false,
  };

  // ─── 3. isFetched Tracking ─────────────────────────────────
  const isFetched = ref({
    user: false,
  });

  // ─── 4. Loading & Error Flags ──────────────────────────────
  const loading = ref(false);
  const actionLoading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => Boolean(token.value));

  // ─── 5. Reset Helper ───────────────────────────────────────
  const resetFetchedFlags = () => {
    isFetched.value = {
      user: false,
    };
  };

  // ─── 6. Login Action ───────────────────────────────────────
  const login = (payload) => {
    if (inFlight.login) return Promise.reject(new Error("Login already in progress"));

    inFlight.login = true;
    loading.value = true;
    actionLoading.value = true;
    error.value = null;

    return new Promise((resolve, reject) => {
      const successHandler = async (res) => {
        const selectedRole = payload.role || "client";
        localStorage.setItem("role", selectedRole);
        role.value = selectedRole;

        const is2FaRequired = Boolean(
          res?.requires_2fa === true ||
          res?.data?.requires_2fa === true ||
          res?.is_2fa_enabled === true ||
          res?.data?.is_2fa_enabled === true ||
          res?.requires_2fa_setup === true ||
          res?.data?.requires_2fa_setup === true
        );

        const tempToken =
          res?.temp_token ||
          res?.data?.temp_token ||
          res?.two_factor_token ||
          res?.data?.two_factor_token;

        // If 2FA authentication or forced setup is required:
        if (is2FaRequired || (tempToken && !res?.access_token && !res?.data?.access_token && !res?.token)) {
          const isSetup = Boolean(res?.requires_2fa_setup || res?.data?.requires_2fa_setup);
          twoFactorData.value = {
            tempToken: tempToken || "",
            role: selectedRole,
            email: payload.email?.trim(),
            redirect: payload.redirect || sessionStorage.getItem("returnUrl") || "",
            isSetup,
            userId: res?.user_id || res?.data?.user_id,
            message: res?.message || res?.data?.message,
          };

          if (tempToken) {
            sessionStorage.setItem("2fa_temp_token", tempToken);
          }
          sessionStorage.setItem("2fa_role", selectedRole);
          if (payload.email) {
            sessionStorage.setItem("2fa_email", payload.email.trim());
          }
          if (payload.redirect) {
            sessionStorage.setItem("2fa_redirect", payload.redirect);
          }
          if (isSetup) {
            sessionStorage.setItem("2fa_is_setup", "true");
          } else {
            sessionStorage.removeItem("2fa_is_setup");
          }

          snackbar.show(
            res?.message || "Please enter your two-factor authentication code.",
            "info"
          );

          router.push({
            path: "/two-factor",
            query: {
              role: selectedRole,
              ...(payload.redirect ? { redirect: payload.redirect } : {}),
            },
          });

          resolve(res);
          return;
        }

        const accessToken = res?.access_token || res?.data?.access_token || res?.token;
        if (accessToken) {
          authToken.setToken(accessToken);
          token.value = accessToken;
        }

        loaderStore.showLoader();

        let isIbUser = false;
        if (selectedRole !== "fm") {
          try {
            const profileRes = await profileStore.fetchUserProfile(true);
            const profileData = profileRes?.data || profileRes;
            isIbUser = Boolean(
              profileData?.is_ib === true ||
              profileData?.is_ib === "true" ||
              profileData?.is_ib === 1 ||
              profileData?.is_ib === "1"
            );
          } catch (err) {
            console.error("Failed to fetch user profile during login:", err);
          }
        }

        const finalRole = selectedRole === "fm" ? "fm" : isIbUser ? "ib" : "client";
        localStorage.setItem("role", finalRole);
        role.value = finalRole;
        profileStore.setActiveRole(finalRole);

        snackbar.show(res?.message || "Logged in successfully!", "success");

        const redirectUrl = payload.redirect || sessionStorage.getItem("returnUrl");
        if (redirectUrl && redirectUrl.startsWith("/")) {
          sessionStorage.removeItem("returnUrl");
          router.push(redirectUrl);
        } else {
          router.push(
            selectedRole === "fm"
              ? "/fm-dashboard"
              : isIbUser
                ? "/ib-dashboard"
                : "/dashboard"
          );
        }

        resolve(res);
      };

      const failureHandler = (err) => {
        const msg = err?.error || err?.message || "Invalid email or password.";
        error.value = msg;
        snackbar.show(msg, "error");
        reject(err);
      };

      const finallyHandler = () => {
        inFlight.login = false;
        loading.value = false;
        actionLoading.value = false;
      };

      apiRequest(urls.KEYS.POST, urls.auth.login, {
        data: {
          email: payload.email?.trim(),
          password: payload.password,
          role: payload.role || "client",
        },
        isTokenRequired: false,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
  };

  // ─── 6b. Verify Login 2FA Action ────────────────────────────
  const verifyLogin2fa = (payload) => {
    if (inFlight.verifyLogin2fa) return Promise.reject(new Error("Verification in progress"));

    inFlight.verifyLogin2fa = true;
    loading.value = true;
    actionLoading.value = true;
    error.value = null;

    const tempToken =
      payload.temp_token ||
      twoFactorData.value?.tempToken ||
      sessionStorage.getItem("2fa_temp_token") ||
      "";

    const selectedRole =
      payload.role ||
      twoFactorData.value?.role ||
      sessionStorage.getItem("2fa_role") ||
      role.value ||
      "client";

    const reqData = {};
    if (payload.totp_code) {
      reqData.totp_code = String(payload.totp_code).trim();
    }
    if (payload.backup_code) {
      reqData.backup_code = String(payload.backup_code).trim();
    }
    if (payload.dont_ask_device !== undefined) {
      reqData.dont_ask_device = payload.dont_ask_device;
    }

    return new Promise((resolve, reject) => {
      const successHandler = async (res) => {
        const accessToken = res?.access_token || res?.data?.access_token || res?.token;
        if (accessToken) {
          authToken.setToken(accessToken);
          token.value = accessToken;
        }

        localStorage.setItem("role", selectedRole);
        role.value = selectedRole;

        // Clean up 2FA temporary session
        sessionStorage.removeItem("2fa_temp_token");
        sessionStorage.removeItem("2fa_role");
        sessionStorage.removeItem("2fa_email");
        sessionStorage.removeItem("2fa_redirect");
        sessionStorage.removeItem("2fa_is_setup");
        twoFactorData.value = null;

        loaderStore.showLoader();

        let isIbUser = false;
        if (selectedRole !== "fm") {
          try {
            const profileRes = await profileStore.fetchUserProfile(true);
            const profileData = profileRes?.data || profileRes;
            isIbUser = Boolean(
              profileData?.is_ib === true ||
              profileData?.is_ib === "true" ||
              profileData?.is_ib === 1 ||
              profileData?.is_ib === "1"
            );
          } catch (err) {
            console.error("Failed to fetch user profile during 2FA login:", err);
          }
        }

        const finalRole = selectedRole === "fm" ? "fm" : isIbUser ? "ib" : "client";
        localStorage.setItem("role", finalRole);
        role.value = finalRole;
        profileStore.setActiveRole(finalRole);

        snackbar.show(res?.message || "Logged in successfully!", "success");

        const redirectUrl =
          payload.redirect ||
          sessionStorage.getItem("2fa_redirect") ||
          sessionStorage.getItem("returnUrl");

        if (redirectUrl && redirectUrl.startsWith("/")) {
          sessionStorage.removeItem("returnUrl");
          router.push(redirectUrl);
        } else {
          router.push(
            selectedRole === "fm"
              ? "/fm-dashboard"
              : isIbUser
                ? "/ib-dashboard"
                : "/dashboard"
          );
        }

        resolve(res);
      };

      const failureHandler = (err) => {
        const msg = err?.error || err?.message || "Invalid authenticator or backup code.";
        error.value = msg;
        snackbar.show(msg, "error");
        reject(err);
      };

      const finallyHandler = () => {
        inFlight.verifyLogin2fa = false;
        loading.value = false;
        actionLoading.value = false;
      };

      const headers = {};
      if (tempToken) {
        headers["Authorization"] = `Bearer ${tempToken}`;
      }

      apiRequest(urls.KEYS.POST, urls.twoFactor.verifyLogin2fa, {
        data: reqData,
        headers,
        role: selectedRole,
        isTokenRequired: false,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
  };

  // ─── 6c. Get 2FA Status Action ─────────────────────────────
  const get2faStatus = (customRole = null) => {
    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.GET, urls.twoFactor.status, {
        role: customRole || role.value || "client",
        onSuccess: (res) => resolve(res),
        onFailure: (err) => reject(err),
      });
    });
  };

  // ─── 6d. Setup 2FA Action (Get QR / Secret) ────────────────
  const setup2fa = (customTempToken = null, customRole = null) => {
    const tempToken =
      customTempToken ||
      sessionStorage.getItem("2fa_temp_token") ||
      null;

    const headers = {};
    if (tempToken) {
      headers["Authorization"] = `Bearer ${tempToken}`;
    }

    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.POST, urls.twoFactor.setup, {
        headers,
        role: customRole || sessionStorage.getItem("2fa_role") || role.value || "client",
        isTokenRequired: !tempToken,
        onSuccess: (res) => resolve(res),
        onFailure: (err) => reject(err),
      });
    });
  };

  // ─── 6e. Confirm 2FA Action ────────────────────────────────
  const confirm2fa = (code, customTempToken = null, customRole = null) => {
    const tempToken =
      customTempToken ||
      sessionStorage.getItem("2fa_temp_token") ||
      null;

    const headers = {};
    if (tempToken) {
      headers["Authorization"] = `Bearer ${tempToken}`;
    }

    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.POST, urls.twoFactor.confirm, {
        data: { code: String(code).trim(), totp_code: String(code).trim() },
        headers,
        role: customRole || sessionStorage.getItem("2fa_role") || role.value || "client",
        isTokenRequired: !tempToken,
        onSuccess: (res) => {
          const accessToken = res?.access_token || res?.data?.access_token;
          if (accessToken) {
            authToken.setToken(accessToken);
            token.value = accessToken;
          }
          resolve(res);
        },
        onFailure: (err) => reject(err),
      });
    });
  };

  // ─── 6f. Disable 2FA Action ────────────────────────────────
  const disable2fa = (payload, customRole = null) => {
    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.POST, urls.twoFactor.disable, {
        data: {
          password: payload.password,
          totp_code: payload.totp_code || undefined,
          backup_code: payload.backup_code || undefined,
        },
        role: customRole || role.value || "client",
        onSuccess: (res) => {
          snackbar.show(res?.message || "2FA disabled successfully.", "success");
          resolve(res);
        },
        onFailure: (err) => {
          const msg = err?.error || err?.message || "Failed to disable 2FA.";
          snackbar.show(msg, "error");
          reject(err);
        },
      });
    });
  };

  // ─── 6g. Regenerate Backup Codes Action ─────────────────────
  const regenerateBackupCodes = (totpCode, customRole = null) => {
    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.POST, urls.twoFactor.regenerateBackupCodes, {
        data: { totp_code: String(totpCode).trim() },
        role: customRole || role.value || "client",
        onSuccess: (res) => {
          snackbar.show(res?.message || "Backup codes regenerated.", "success");
          resolve(res);
        },
        onFailure: (err) => {
          const msg = err?.error || err?.message || "Failed to regenerate backup codes.";
          snackbar.show(msg, "error");
          reject(err);
        },
      });
    });
  };

  // ─── 7. Start / Check Registration (Step 1) ────────────────
  const startRegistration = (payload) => {
    if (inFlight.startRegistration || inFlight.sendOtp) {
      return Promise.reject(new Error("Registration request already in progress"));
    }

    inFlight.startRegistration = true;
    inFlight.sendOtp = true;
    loading.value = true;
    actionLoading.value = true;
    error.value = null;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        const nextStep = res?.next_step;
        if (nextStep === "LOGIN") {
          snackbar.show(res?.message || "User already registered. Please login.", "info");
        } else if (nextStep === "COMPLETE_PROFILE") {
          snackbar.show(
            res?.message || "OTP already verified. Please complete your profile.",
            "success"
          );
        } else {
          snackbar.show(res?.message || "OTP sent successfully to your email!", "success");
        }
        resolve(res);
      };

      const failureHandler = (err) => {
        const msg = err?.message || err?.error || "Failed to start registration.";
        error.value = msg;
        snackbar.show(msg, "error");
        reject(err);
      };

      const finallyHandler = () => {
        inFlight.startRegistration = false;
        inFlight.sendOtp = false;
        loading.value = false;
        actionLoading.value = false;
      };

      apiRequest(urls.KEYS.POST, urls.registration.start, {
        data: {
          email: payload.email?.trim(),
          phone: payload.phone || payload.phone_number,
          country: payload.country,
          referral_code: payload.referral_code || undefined,
        },
        isTokenRequired: false,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
  };

  // ─── 8. Verify Registration OTP (Step 2) ────────────────────
  const verifyRegistrationOtp = (payload) => {
    if (inFlight.verifyRegistrationOtp || inFlight.verifyOtp) {
      return Promise.reject(new Error("Verification already in progress"));
    }

    inFlight.verifyRegistrationOtp = true;
    inFlight.verifyOtp = true;
    loading.value = true;
    actionLoading.value = true;
    error.value = null;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        snackbar.show(res?.message || "OTP verified successfully!", "success");
        resolve(res);
      };

      const failureHandler = (err) => {
        const msg = err?.message || err?.error || "Invalid OTP code.";
        error.value = msg;
        snackbar.show(msg, "error");
        reject(err);
      };

      const finallyHandler = () => {
        inFlight.verifyRegistrationOtp = false;
        inFlight.verifyOtp = false;
        loading.value = false;
        actionLoading.value = false;
      };

      apiRequest(urls.KEYS.POST, urls.registration.verifyOtp, {
        data: {
          email: payload.email?.trim(),
          otp: String(payload.otp || "").trim(),
        },
        isTokenRequired: false,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
  };

  // ─── 9. Complete Registration (Step 3) ──────────────────────
  const completeRegistration = (payload) => {
    if (inFlight.completeRegistration || inFlight.register) {
      return Promise.reject(new Error("Registration in progress"));
    }

    inFlight.completeRegistration = true;
    inFlight.register = true;
    loading.value = true;
    actionLoading.value = true;
    error.value = null;

    return new Promise((resolve, reject) => {
      const successHandler = async (res) => {
        snackbar.show(res?.message || "Registration completed successfully!", "success");

        const accessToken = res?.access_token || res?.data?.access_token || res?.token;
        if (accessToken) {
          authToken.setToken(accessToken);
          token.value = accessToken;
          localStorage.setItem("role", "client");
          role.value = "client";

          try {
            await profileStore.fetchUserProfile(true);
          } catch (e) {
            console.error("Profile fetch error after registration:", e);
          }

          router.push("/dashboard");
        } else {
          // If token not returned, auto login or redirect to login
          if (payload.password) {
            try {
              await login({
                email: payload.email,
                password: payload.password,
                role: payload.role || "client",
              });
            } catch {
              router.push("/login");
            }
          } else {
            router.push("/login");
          }
        }
        resolve(res);
      };

      const failureHandler = (err) => {
        const msg = err?.message || err?.error || "Registration failed.";
        error.value = msg;
        snackbar.show(msg, "error");
        reject(err);
      };

      const finallyHandler = () => {
        inFlight.completeRegistration = false;
        inFlight.register = false;
        loading.value = false;
        actionLoading.value = false;
      };

      apiRequest(urls.KEYS.POST, urls.registration.complete, {
        data: {
          email: payload.email?.trim(),
          password: payload.password,
          name: payload.name?.trim(),
          phone_number: payload.phone_number || payload.phone,
          country: payload.country,
          date_of_birth: payload.date_of_birth,
          referral_code: payload.referral_code || undefined,
          role: payload.role || "client",
        },
        isTokenRequired: false,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
  };

  // Backward-compatible aliases
  const sendSignupOtp = startRegistration;
  const verifyEmailOtp = verifyRegistrationOtp;
  const registerUser = completeRegistration;

  // ─── 10. Forgot Password Action ────────────────────────────
  const forgotPassword = (email) => {
    if (inFlight.forgotPassword) return Promise.reject(new Error("Request in progress"));

    inFlight.forgotPassword = true;
    loading.value = true;
    actionLoading.value = true;
    error.value = null;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        snackbar.show(
          res?.message || "Password reset email sent successfully. Please check your inbox.",
          "success"
        );
        resolve(res);
      };

      const failureHandler = (err) => {
        const msg = err?.error || err?.message || "Failed to send reset link.";
        error.value = msg;
        snackbar.show(msg, "error");
        reject(err);
      };

      const finallyHandler = () => {
        inFlight.forgotPassword = false;
        loading.value = false;
        actionLoading.value = false;
      };

      apiRequest(urls.KEYS.POST, urls.auth.forgotPassword, {
        data: { email },
        isTokenRequired: false,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
  };

  // ─── 11. Reset Password Action ─────────────────────────────
  const resetPassword = (payload) => {
    if (inFlight.resetPassword) return Promise.reject(new Error("Request in progress"));

    inFlight.resetPassword = true;
    loading.value = true;
    actionLoading.value = true;
    error.value = null;

    return new Promise((resolve, reject) => {
      const successHandler = (res) => {
        snackbar.show(
          res?.message || "Password reset successfully! Please log in.",
          "success"
        );
        resolve(res);
      };

      const failureHandler = (err) => {
        const msg = err?.error || err?.message || "Failed to reset password.";
        error.value = msg;
        snackbar.show(msg, "error");
        reject(err);
      };

      const finallyHandler = () => {
        inFlight.resetPassword = false;
        loading.value = false;
        actionLoading.value = false;
      };

      apiRequest(urls.KEYS.POST, urls.auth.resetPassword, {
        data: {
          token: payload.token,
          new_password: payload.newPassword,
          confirm_password: payload.confirmPassword,
        },
        isTokenRequired: false,
        onSuccess: successHandler,
        onFailure: failureHandler,
        onFinally: finallyHandler,
      });
    });
  };

  // ─── 12. Logout Action ─────────────────────────────────────
  const logout = () => {
    authToken.removeToken();
    token.value = null;
    user.value = null;
    resetFetchedFlags();
    themeStore.resetTheme();
    profileStore.reset();
    router.push("/login");
  };

  return {
    // State
    token,
    role,
    user,
    twoFactorData,
    isAuthenticated,
    loading,
    actionLoading,
    error,
    isFetched,
    // Helpers & Actions
    resetFetchedFlags,
    login,
    verifyLogin2fa,
    get2faStatus,
    setup2fa,
    confirm2fa,
    disable2fa,
    regenerateBackupCodes,
    startRegistration,
    verifyRegistrationOtp,
    completeRegistration,
    sendSignupOtp,
    verifyEmailOtp,
    registerUser,
    forgotPassword,
    resetPassword,
    logout,
  };
});
