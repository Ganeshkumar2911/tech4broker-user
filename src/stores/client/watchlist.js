import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiRequest from '@/api/request';
import urls from '@/api/urls';
import { useSnackbarStore } from '@/stores/shared/snackbar';
import { useTickerStore } from '@/stores/shared/ticker';

export const useWatchlistStore = defineStore('watchlist', () => {
  const snackbar = useSnackbarStore();
  const tickerStore = useTickerStore();

  const watchlists = ref([]);
  const activeWatchlistId = ref(null);
  const activeWatchlistDetail = ref(null);

  const catalogSymbols = ref([]);
  const loadingWatchlists = ref(false);
  const loadingDetail = ref(false);
  const loadingCatalog = ref(false);
  const actionLoading = ref(false);

  // Active symbols list array
  const activeSymbols = computed(() => {
    if (!activeWatchlistDetail.value?.symbols) return [];
    return activeWatchlistDetail.value.symbols;
  });

  // Current active watchlist info
  const activeWatchlist = computed(() => {
    if (!activeWatchlistId.value) return null;
    return watchlists.value.find(w => w.id === activeWatchlistId.value) || activeWatchlistDetail.value || null;
  });

  // 1. Fetch Watchlists List
  const fetchWatchlists = () => {
    loadingWatchlists.value = true;
    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.GET, urls.watchlists.list, {
        isTokenRequired: true,
        onSuccess: (res) => {
          loadingWatchlists.value = false;
          const list = res?.data || res || [];
          watchlists.value = Array.isArray(list) ? list : [];

          if (watchlists.value.length > 0) {
            // Pick default or first watchlist if current selection is invalid
            const currentExists = watchlists.value.some(w => w.id === activeWatchlistId.value);
            if (!currentExists) {
              const defaultWl = watchlists.value.find(w => w.is_default) || watchlists.value[0];
              activeWatchlistId.value = defaultWl.id;
            }
            fetchWatchlistDetail(activeWatchlistId.value);
          } else {
            // Auto-create default watchlist if user has zero watchlists
            createWatchlist("My Favorites", true);
          }
          resolve(watchlists.value);
        },
        onFailure: (err) => {
          loadingWatchlists.value = false;
          console.error("Failed to fetch watchlists:", err);
          reject(err);
        }
      });
    });
  };

  // 2. Fetch Single Watchlist Detail with symbols
  const fetchWatchlistDetail = (watchlistId) => {
    if (!watchlistId) return Promise.resolve(null);
    loadingDetail.value = true;
    activeWatchlistId.value = watchlistId;

    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.GET, urls.watchlists.detail(watchlistId), {
        isTokenRequired: true,
        onSuccess: (res) => {
          loadingDetail.value = false;
          const detail = res?.data || res || null;
          activeWatchlistDetail.value = detail;

          // Subscribe symbols to live WebSocket updates
          if (detail?.symbols && Array.isArray(detail.symbols)) {
            const symList = detail.symbols.map(s => s.symbol);
            if (symList.length > 0) {
              tickerStore.updateTickerList(symList);
            }
          }

          resolve(detail);
        },
        onFailure: (err) => {
          loadingDetail.value = false;
          console.error("Failed to fetch watchlist detail:", err);
          reject(err);
        }
      });
    });
  };

  // 3. Create Watchlist
  const createWatchlist = (name, isDefault = false) => {
    actionLoading.value = true;
    const payload = {
      name: name.trim(),
      is_default: isDefault,
      sort_order: watchlists.value.length
    };

    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.POST, urls.watchlists.create, {
        data: payload,
        isTokenRequired: true,
        onSuccess: (res) => {
          actionLoading.value = false;
          snackbar.show("Watchlist created successfully", "success");
          const created = res?.data || res;
          if (created?.id) {
            activeWatchlistId.value = created.id;
          }
          fetchWatchlists();
          resolve(created);
        },
        onFailure: (err) => {
          actionLoading.value = false;
          snackbar.show(err?.message || "Failed to create watchlist", "error");
          reject(err);
        }
      });
    });
  };

  // 4. Update / Rename Watchlist
  const updateWatchlist = (watchlistId, payload) => {
    actionLoading.value = true;
    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.PATCH, urls.watchlists.update(watchlistId), {
        data: payload,
        isTokenRequired: true,
        onSuccess: (res) => {
          actionLoading.value = false;
          snackbar.show("Watchlist updated successfully", "success");
          fetchWatchlists();
          resolve(res);
        },
        onFailure: (err) => {
          actionLoading.value = false;
          snackbar.show(err?.message || "Failed to update watchlist", "error");
          reject(err);
        }
      });
    });
  };

  // 5. Delete Watchlist
  const deleteWatchlist = (watchlistId) => {
    actionLoading.value = true;
    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.DELETE, urls.watchlists.delete(watchlistId), {
        isTokenRequired: true,
        onSuccess: (res) => {
          actionLoading.value = false;
          snackbar.show("Watchlist deleted successfully", "success");
          watchlists.value = watchlists.value.filter(w => w.id !== watchlistId);
          if (activeWatchlistId.value === watchlistId) {
            activeWatchlistId.value = watchlists.value[0]?.id || null;
          }
          fetchWatchlists();
          resolve(res);
        },
        onFailure: (err) => {
          actionLoading.value = false;
          snackbar.show(err?.message || "Failed to delete watchlist", "error");
          reject(err);
        }
      });
    });
  };

  // 6. Search Symbol Catalog to Add
  const searchCatalogSymbols = (search = '', category = '') => {
    loadingCatalog.value = true;
    const params = {};
    if (search && search.trim()) params.search = search.trim();
    if (category && category !== 'All') params.category = category;

    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.GET, urls.watchlists.searchSymbols, {
        params,
        isTokenRequired: true,
        onSuccess: (res) => {
          loadingCatalog.value = false;
          const list = res?.data || res || [];
          catalogSymbols.value = Array.isArray(list) ? list : [];
          resolve(catalogSymbols.value);
        },
        onFailure: (err) => {
          loadingCatalog.value = false;
          console.error("Failed to search symbol catalog:", err);
          catalogSymbols.value = [];
          reject(err);
        }
      });
    });
  };

  // 7. Add Symbol(s) to Watchlist
  const addSymbolToWatchlist = (watchlistId, symbolOrArray) => {
    actionLoading.value = true;
    const payload = Array.isArray(symbolOrArray)
      ? { symbols: symbolOrArray }
      : { symbol: symbolOrArray };

    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.POST, urls.watchlists.addSymbols(watchlistId), {
        data: payload,
        isTokenRequired: true,
        onSuccess: (res) => {
          actionLoading.value = false;
          snackbar.show("Symbol added to watchlist", "success");
          fetchWatchlistDetail(watchlistId);
          resolve(res);
        },
        onFailure: (err) => {
          actionLoading.value = false;
          snackbar.show(err?.message || "Failed to add symbol", "error");
          reject(err);
        }
      });
    });
  };

  // 8. Remove Symbol by Name
  const removeSymbolByName = (watchlistId, symbol) => {
    actionLoading.value = true;
    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.DELETE, urls.watchlists.removeSymbolByName(watchlistId, symbol), {
        isTokenRequired: true,
        onSuccess: (res) => {
          actionLoading.value = false;
          snackbar.show(`${symbol} removed from watchlist`, "success");
          fetchWatchlistDetail(watchlistId);
          resolve(res);
        },
        onFailure: (err) => {
          actionLoading.value = false;
          snackbar.show(err?.message || "Failed to remove symbol", "error");
          reject(err);
        }
      });
    });
  };

  // 9. Remove Symbol by Joiner ID
  const removeSymbolById = (watchlistId, symbolId) => {
    actionLoading.value = true;
    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.DELETE, urls.watchlists.removeSymbolById(watchlistId, symbolId), {
        isTokenRequired: true,
        onSuccess: (res) => {
          actionLoading.value = false;
          snackbar.show("Symbol removed from watchlist", "success");
          fetchWatchlistDetail(watchlistId);
          resolve(res);
        },
        onFailure: (err) => {
          actionLoading.value = false;
          snackbar.show(err?.message || "Failed to remove symbol", "error");
          reject(err);
        }
      });
    });
  };

  // 10. Reorder Symbols
  const reorderSymbols = (watchlistId, orderedSymbolsArray) => {
    if (activeWatchlistDetail.value?.symbols) {
      // Optimistic update
      const map = new Map(activeWatchlistDetail.value.symbols.map(s => [s.symbol, s]));
      const reordered = orderedSymbolsArray.map(sym => map.get(sym)).filter(Boolean);
      activeWatchlistDetail.value.symbols = reordered;
    }

    return new Promise((resolve, reject) => {
      apiRequest(urls.KEYS.PATCH, urls.watchlists.reorderSymbols(watchlistId), {
        data: { ordered_symbols: orderedSymbolsArray },
        isTokenRequired: true,
        onSuccess: (res) => {
          resolve(res);
        },
        onFailure: (err) => {
          console.error("Failed to reorder symbols:", err);
          fetchWatchlistDetail(watchlistId);
          reject(err);
        }
      });
    });
  };

  return {
    watchlists,
    activeWatchlistId,
    activeWatchlistDetail,
    activeSymbols,
    activeWatchlist,
    catalogSymbols,
    loadingWatchlists,
    loadingDetail,
    loadingCatalog,
    actionLoading,

    fetchWatchlists,
    fetchWatchlistDetail,
    createWatchlist,
    updateWatchlist,
    deleteWatchlist,
    searchCatalogSymbols,
    addSymbolToWatchlist,
    removeSymbolByName,
    removeSymbolById,
    reorderSymbols
  };
});

export default useWatchlistStore;
