import apiRequest from "@/api/request";
import { calculateFromDate, getCurrentDate } from "@/utils/chart/calculation";
import { createDefaultChartStyleOverrides, deepMerge } from "@/utils/chart/chartStyles";
import { getChart, isMainIndicator } from "@/utils/chart/chart";
import { instruments } from "@/utils/instruments";
import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useHistoricalDataStore } from "./historical";

export const useChartStore = defineStore('chart', () => {
    // Data state
    const historicalCandles = ref([]);
    const isLoadingCandles = ref(false);
    const noData = ref(false);
    const activeOverlay = ref(null)
    const selectedOverlays = ref([])
    const showChartStyleModal = ref(false);
    // Chart configuration state - centralized from chart component
    const selectedInterval = ref({ label: '1 m', value: 'minute', span: 1, type: 'minute' });
    const selectedIndicators = ref([]);
    const selectedTool = ref(null);
    const showIndicatorModal = ref(false);
    const selectedCandleType = ref({ value: "candle_solid", label: "Candle Solid" });
    const getDefaultStyles = () => createDefaultChartStyleOverrides(localStorage.getItem('mode') || 'light');
    const chartStyleOverrides = ref(getDefaultStyles());
    // Symbol information
    const currentSymbol = ref('BTCUSD');

    // Tabs state
    const tabs = ref([]);
    const activeTabId = ref('');

    const loadTabs = () => {
        const saved = localStorage.getItem('chart_tabs');
        const savedActiveId = localStorage.getItem('chart_active_tab_id');
        if (saved) {
            try {
                tabs.value = JSON.parse(saved);
                if (savedActiveId && tabs.value.some(t => t.id === savedActiveId)) {
                    activeTabId.value = savedActiveId;
                } else if (tabs.value.length > 0) {
                    activeTabId.value = tabs.value[0].id;
                }
            } catch (e) {
                console.error('Failed to load tabs', e);
            }
        }
        
        if (tabs.value.length === 0) {
            const defaultTab = {
                id: Date.now().toString(),
                symbol: currentSymbol.value || instruments[0]?.symbol || 'SOLUSDT',
                interval: selectedInterval.value,
                candleType: selectedCandleType.value
            };
            tabs.value = [defaultTab];
            activeTabId.value = defaultTab.id;
        }
        
        const activeTab = tabs.value.find(t => t.id === activeTabId.value);
        if (activeTab) {
            currentSymbol.value = activeTab.symbol;
            selectedInterval.value = activeTab.interval;
            selectedCandleType.value = activeTab.candleType;
            if (chartStyleOverrides.value?.candle && activeTab.candleType?.value) {
                chartStyleOverrides.value.candle.type = activeTab.candleType.value;
            }
        }
    };

    const saveTabs = () => {
        localStorage.setItem('chart_tabs', JSON.stringify(tabs.value));
        localStorage.setItem('chart_active_tab_id', activeTabId.value);
    };

    const loadIndicators = () => {
        const saved = localStorage.getItem('chart_indicators');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    selectedIndicators.value = parsed.map(ind => {
                        const isMain = isMainIndicator(ind);
                        return {
                            ...ind,
                            type: isMain ? 'main' : (ind.type || 'sub'),
                            paneId: isMain ? 'candle_pane' : (ind.paneId && ind.paneId !== 'candle_pane' ? ind.paneId : `pane-${ind.name}`)
                        };
                    });
                }
            } catch (e) {
                console.error('Failed to load indicators', e);
            }
        }
    };

    const saveIndicators = () => {
        const serialized = selectedIndicators.value.map(i => {
            const isMain = isMainIndicator(i);
            return {
                name: i.name,
                type: isMain ? 'main' : (i.type || 'sub'),
                series: i.series,
                paneId: isMain ? 'candle_pane' : (i.paneId && i.paneId !== 'candle_pane' ? i.paneId : `pane-${i.name}`),
                id: i.id || i.name,
                calcParams: i.calcParams,
                styles: i.styles,
                shortName: i.shortName
            };
        });
        localStorage.setItem('chart_indicators', JSON.stringify(serialized));
    };

    const setActiveTab = (tabId) => {
        const tab = tabs.value.find(t => t.id === tabId);
        if (tab) {
            activeTabId.value = tabId;
            currentSymbol.value = tab.symbol;
            selectedInterval.value = tab.interval;
            selectedCandleType.value = tab.candleType;
            if (chartStyleOverrides.value?.candle && tab.candleType?.value) {
                chartStyleOverrides.value.candle.type = tab.candleType.value;
            }
            saveTabs();
        }
    };

    const closeTab = (tabId) => {
        if (tabs.value.length <= 1) return;
        const index = tabs.value.findIndex(t => t.id === tabId);
        if (index === -1) return;
        
        tabs.value.splice(index, 1);
        
        if (activeTabId.value === tabId) {
            const nextActiveIndex = Math.min(index, tabs.value.length - 1);
            setActiveTab(tabs.value[nextActiveIndex].id);
        } else {
            saveTabs();
        }
    };

    const addTab = (symbol = 'XAUUSD') => {
        const newTab = {
            id: Date.now().toString(),
            symbol: symbol,
            interval: { label: '1 m', value: 'minute', span: 1, type: 'minute' },
            candleType: { value: "candle_solid", label: "Candle Solid" }
        };
        tabs.value.push(newTab);
        setActiveTab(newTab.id);
    };

    const openSymbolInTab = (symbol) => {
        const existingTab = tabs.value.find(t => t.symbol === symbol);
        if (existingTab) {
            setActiveTab(existingTab.id);
        } else {
            addTab(symbol);
        }
    };

    const saveDrawings = () => {
        const chart = getChart();
        if (!chart) return;
        const all = chart.getOverlays();
        const systemOverlayNames = ['positionLine', 'arrowMarker', 'tradeLine'];
        const userDrawings = all.filter(o => !systemOverlayNames.includes(o.name));
        
        const serialized = userDrawings.map(o => ({
            name: o.name,
            id: o.id,
            points: o.points,
            styles: o.styles,
            lock: o.lock
        }));
        
        localStorage.setItem(`chart_drawings_${currentSymbol.value}`, JSON.stringify(serialized));
    };

    const restoreDrawings = () => {
        const chart = getChart();
        if (!chart) return;
        
        const saved = localStorage.getItem(`chart_drawings_${currentSymbol.value}`);
        if (saved) {
            try {
                const drawings = JSON.parse(saved);
                drawings.forEach(d => {
                    chart.createOverlay({
                        ...d,
                        onDrawEnd: (data) => {
                            const exists = selectedOverlays.value.some(o => o.id === data.overlay.id);
                            if (!exists) {
                                selectedOverlays.value.push({ name: data.overlay.name, id: data.overlay.id });
                            }
                            saveDrawings();
                        },
                        onRemoved: (data) => {
                            selectedOverlays.value = selectedOverlays.value.filter(o => o.id != data.overlay.id);
                            if (activeOverlay.value?.id == data.overlay.id) {
                                activeOverlay.value = null;
                            }
                            saveDrawings();
                        },
                        onSelected: (data) => {
                            activeOverlay.value = { name: data.overlay.name, id: data.overlay.id };
                        },
                        onDeselected: (data) => {
                            if (activeOverlay.value?.id == data.overlay.id) {
                                activeOverlay.value = null;
                            }
                        },
                        onPressedMoveEnd: (data) => {
                            saveDrawings();
                        }
                    });
                });
            } catch (e) {
                console.error('Failed to restore drawings', e);
            }
        }
    };

    watch(currentSymbol, (newSym) => {
        const activeTab = tabs.value.find(t => t.id === activeTabId.value);
        if (activeTab && activeTab.symbol !== newSym) {
            activeTab.symbol = newSym;
            saveTabs();
        }
    });

    watch(selectedInterval, (newVal) => {
        const activeTab = tabs.value.find(t => t.id === activeTabId.value);
        if (activeTab) {
            activeTab.interval = newVal;
            saveTabs();
        }
    }, { deep: true });

    watch(selectedCandleType, (newVal) => {
        const activeTab = tabs.value.find(t => t.id === activeTabId.value);
        if (activeTab) {
            activeTab.candleType = newVal;
            saveTabs();
        }
        if (chartStyleOverrides.value?.candle && newVal?.value) {
            chartStyleOverrides.value.candle.type = newVal.value;
        }
    }, { deep: true });

    watch(selectedIndicators, () => {
        saveIndicators();
    }, { deep: true });

    loadTabs();
    loadIndicators();

    const historicalStore = useHistoricalDataStore();

    const getHistoricalData = async (symbolOverride, intervalOverride) => {
        isLoadingCandles.value = true;
        try {
            if (symbolOverride) {
                currentSymbol.value = symbolOverride;
            }
            if (intervalOverride) {
                selectedInterval.value = intervalOverride;
            }
            const data = await historicalStore.fetchHistoricalData(currentSymbol.value, selectedInterval.value);
            historicalCandles.value = data;
            noData.value = historicalStore.noData;
            isLoadingCandles.value = false;
            return data;
        } catch (error) {
            console.error('Error fetching historical candles:', error);
            historicalCandles.value = [];
            isLoadingCandles.value = false;
            return [];
        }
    };

    // Set current symbol
    const setCurrentSymbol = (script) => {
        if (script) {
            currentSymbol.value = script;
        }
    };

    // Helper to remove indicator
    const removeIndicator = (indicatorName) => {
        selectedIndicators.value = selectedIndicators.value.filter(
            indicator => indicator.value.toUpperCase() !== indicatorName
        );
    };

    // Helper to add indicator
    const addIndicator = (indicator) => {
        const exists = selectedIndicators.value.find(
            ind => ind.value === indicator.value
        );
        if (!exists) {
            selectedIndicators.value.push(indicator);
        }
    };

    const setChartStyleOverrides = (styles) => {
        chartStyleOverrides.value = deepMerge(getDefaultStyles(), styles);
    }

    const resetChartStyleOverrides = () => {
        chartStyleOverrides.value = getDefaultStyles();
    }

    return {
        // Data
        noData,
        historicalCandles,
        isLoadingCandles,

        // Chart configuration
        selectedInterval,
        selectedIndicators,
        selectedTool,

        // Symbol info
        currentSymbol,
        // Methods
        getHistoricalData,
        fetchHistoricalData: getHistoricalData,
        setChartStyleOverrides,
        resetChartStyleOverrides,
        setCurrentSymbol,
        removeIndicator,
        addIndicator,
        activeOverlay,
        showIndicatorModal,
        selectedOverlays,
        showChartStyleModal,
        selectedCandleType,
        chartStyleOverrides,

        // Tabs state & methods
        tabs,
        activeTabId,
        setActiveTab,
        closeTab,
        addTab,
        openSymbolInTab,
        saveDrawings,
        restoreDrawings
    };
});
