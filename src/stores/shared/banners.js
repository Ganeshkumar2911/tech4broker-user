import { defineStore } from "pinia";
import { ref } from "vue";
import apiRequest from "@/api/request";
import urls from "@/api/urls";
import defaultBanner from "@/assets/header.png";
import { useProfileStore } from "@/stores/shared/profile";

export const useBannersStore = defineStore("banners", () => {
  const banners = ref([]);
  const loading = ref(false);
  const fetchedType = ref(null); // 'mobile_client' | 'web_client' | etc.

  const defaultBanners = [{ id: 1, image_url: defaultBanner }];

  const fetchBanners = (force = false) => {
    const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false;
    const platform = isMobile ? "mobile" : "web";

    const profileStore = useProfileStore();
    const rawRole =
      profileStore.activeRole ||
      profileStore.user?.role ||
      localStorage.getItem("role") ||
      "client";
    const role = String(rawRole).toLowerCase();

    const currentKey = `${platform}_${role}`;

    if (!force && (loading.value || (fetchedType.value === currentKey && banners.value.length > 0))) {
      return;
    }

    loading.value = true;

    const successHandler = (res) => {
      loading.value = false;

      const rawList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.image_links)
        ? res.image_links
        : [];

      if (Array.isArray(rawList) && rawList.length > 0) {
        banners.value = rawList.map((item, id) => {
          if (typeof item === "string") {
            return {
              id: id + 1,
              title: "",
              image_url: item,
              url: item,
              description: "",
              redirect_url: "",
            };
          }
          return {
            id: item.id ?? id + 1,
            title: item.title || "",
            image_url: item.url || item.image_url || item.image || "",
            url: item.url || item.image_url || item.image || "",
            description: item.description || "",
            redirect_url: item.description || item.redirect_url || "",
          };
        });
      } else {
        banners.value = defaultBanners;
      }
      fetchedType.value = currentKey;
    };

    const failureHandler = () => {
      loading.value = false;
      banners.value = defaultBanners;
      fetchedType.value = currentKey;
    };

    apiRequest(urls.KEYS.GET, urls.dashboard.getBannerList, {
      params: {
        platform,
        role,
      },
      isTokenRequired: true,
      onSuccess: successHandler,
      onFailure: failureHandler,
    });
  };

  return {
    banners,
    loading,
    fetchedType,
    fetchBanners,
  };
});
