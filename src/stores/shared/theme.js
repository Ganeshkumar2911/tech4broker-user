import { defineStore } from "pinia";
import { ref } from "vue";
import { useProfileStore } from "@/stores/shared/profile";

export const useThemeStore = defineStore("theme", () => {
  const isDark = ref(false);

  const applyThemeClass = (dark) => {
    if (typeof document === "undefined") return;
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const setThemeFromProfile = (themeVal) => {
    let dark = false;
    if (typeof themeVal === "boolean") {
      dark = themeVal;
    } else if (typeof themeVal === "string") {
      dark = themeVal.toLowerCase() === "dark" || themeVal === "1" || themeVal === "true";
    } else if (typeof themeVal === "number") {
      dark = themeVal === 1;
    }
    isDark.value = dark;
    applyThemeClass(dark);
  };

  const resetTheme = () => {
    isDark.value = false;
    applyThemeClass(false);
  };

  const syncThemeWithApi = async (darkBool) => {
    try {
      const profileStore = useProfileStore();
      if (profileStore.user) {
        await profileStore.updateUserProfile({ theme: darkBool }, { silent: true, cancelPrevious: true });
      }
    } catch (err) {
      console.error("Failed to sync theme with profile API:", err);
    }
  };

  const init = () => {
    const profileStore = useProfileStore();
    const userTheme = profileStore.user?.theme ?? profileStore.user?.data?.theme;

    if (userTheme !== undefined && userTheme !== null) {
      setThemeFromProfile(userTheme);
      return;
    }

    // Default to Light mode when no profile is available (e.g. auth/public)
    resetTheme();
  };

  const toggleTheme = async (event) => {
    const newDark = !isDark.value;
    const isAppearanceTransition =
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isAppearanceTransition) {
      isDark.value = newDark;
      applyThemeClass(isDark.value);
      syncThemeWithApi(newDark);
      return;
    }

    let x = window.innerWidth;
    let y = 0;
    if (event) {
      if (
        typeof event.clientX === "number" &&
        typeof event.clientY === "number" &&
        (event.clientX !== 0 || event.clientY !== 0)
      ) {
        x = event.clientX;
        y = event.clientY;
      } else if (event.currentTarget && typeof event.currentTarget.getBoundingClientRect === "function") {
        const rect = event.currentTarget.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(async () => {
      isDark.value = newDark;
      applyThemeClass(isDark.value);
    });

    try {
      await transition.ready;

      const animation = document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 700,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );

      animation.finished
        .then(() => {
          syncThemeWithApi(newDark);
        })
        .catch(() => {
          syncThemeWithApi(newDark);
        });
    } catch (e) {
      syncThemeWithApi(newDark);
    }
  };

  return { isDark, init, resetTheme, toggleTheme, setThemeFromProfile, syncThemeWithApi };
});
