const authToken = {
  setToken: (accessToken = null) => {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("panther_tour_session_shown");
      }
    }
  },
  getToken: () => {
    return {
      accessToken: localStorage.getItem("accessToken"),
    };
  },
  removeToken: () => {
    // clear local store and session store
    localStorage.clear();
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
    }
  },
};
export default authToken;
