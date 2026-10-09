import { chartTypes, getChart } from "./chart";

const DASH_MAP = {
  dashed: [6, 4],
  dotted: [2, 4],
};

export function createDefaultChartStyleOverrides(mode = "light") {
  const isDark = mode === "dark";

  return {
    grid: {
      show: true,
      horizontal: {
        show: true,
        size: 1,
        color: isDark ? "#26334D" : "#E2E8F0",
        style: "dashed",
        dashedValue: [2, 2],
      },
      vertical: {
        show: true,
        size: 1,
        color: isDark ? "#26334D" : "#E2E8F0",
        style: "dashed",
        dashedValue: [2, 2],
      },
    },
    candle: {
      type: "candle_solid",
      bar: {
        compareRule: "current_open",
        upColor: "#478778",
        downColor: "#EE4B2B",
        noChangeColor: "#888888",
        upBorderColor: "#478778",
        downBorderColor: "#EE4B2B",
        noChangeBorderColor: "#888888",
        upWickColor: "#478778",
        downWickColor: "#EE4B2B",
        noChangeWickColor: "#888888",
      },
      priceMark: {
        show: true,
      },
      tooltip: {
        showRule: "none",
      },
    },
    background: {
      color: isDark ? "#131B2E" : "#ffffff",
    },
  };
}

export function createChartBaseStyle() {
  return {
    indicator: {
      showName: false,
      showParams: false,
      showValue: false,
    },
    overlay: {
      showName: false,
      showParams: false,
      showValue: false,
    },
    xAxis: {
      show: true,
    },
    yAxis: {
      show: true,
    },
  };
}

export function getThemeChartStyle(mode) {
  if (mode === "dark") {
    return {
      background: {
        color: "#131B2E",
      },
      grid: {
        horizontal: {
          color: "#26334D",
        },
        vertical: {
          color: "#26334D",
        },
      },
      xAxis: {
        axisLine: { color: "#26334D" },
        tickLine: { color: "#26334D" },
        tickText: { color: "#94A3B8" },
      },
      yAxis: {
        axisLine: { color: "#26334D" },
        tickLine: { color: "#26334D" },
        tickText: { color: "#94A3B8" },
      },
    };
  }

  return {
    background: {
      color: "#ffffff",
    },
    grid: {
      horizontal: {
        color: "#E2E8F0",
      },
      vertical: {
        color: "#E2E8F0",
      },
    },
    xAxis: {
      axisLine: { color: "#E2E8F0" },
      tickLine: { color: "#E2E8F0" },
      tickText: { color: "#64748B" },
    },
    yAxis: {
      axisLine: { color: "#E2E8F0" },
      tickLine: { color: "#E2E8F0" },
      tickText: { color: "#64748B" },
    },
  };
}

export function deepMerge(target, source) {
  const output = Array.isArray(target) ? [...target] : { ...target };

  if (!source || typeof source !== "object") {
    return output;
  }

  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = output[key];

    if (Array.isArray(sourceValue)) {
      output[key] = [...sourceValue];
      return;
    }

    if (
      sourceValue &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === "object" &&
      !Array.isArray(targetValue)
    ) {
      output[key] = deepMerge(targetValue, sourceValue);
      return;
    }

    output[key] = sourceValue;
  });

  return output;
}

export function cloneChartStyle(style) {
  return deepMerge({}, style);
}

export function normalizeLineStyle(styleConfig) {
  const normalized = cloneChartStyle(styleConfig);
  const horizontalStyle = normalized?.grid?.horizontal?.style;
  const verticalStyle = normalized?.grid?.vertical?.style;

  if (horizontalStyle && DASH_MAP[horizontalStyle]) {
    normalized.grid.horizontal.dashedValue = [...DASH_MAP[horizontalStyle]];
  }

  if (verticalStyle && DASH_MAP[verticalStyle]) {
    normalized.grid.vertical.dashedValue = [...DASH_MAP[verticalStyle]];
  }

  return normalized;
}

export function buildChartStyles(mode, overrides) {
  const themeStyle = getThemeChartStyle(mode);
  const defaultStyle = createDefaultChartStyleOverrides(mode);
  const merged = deepMerge(
    deepMerge(createChartBaseStyle(), themeStyle),
    deepMerge(defaultStyle, normalizeLineStyle(overrides || {}))
  );

  if (overrides?.candle?.type) {
    merged.candle.type = overrides.candle.type;
  }

  // Ensure grid color dynamically responds to theme mode if user hasn't explicitly set a custom color
  if (!overrides?.isUserCustomGridColor && themeStyle.grid) {
    if (merged.grid?.horizontal) merged.grid.horizontal.color = themeStyle.grid.horizontal.color;
    if (merged.grid?.vertical) merged.grid.vertical.color = themeStyle.grid.vertical.color;
  }

  return merged;
}

export function applyChartStyles(mode, overrides, chart = getChart()) {
  if (!chart) return;
  chart.setStyles(buildChartStyles(mode, overrides));
}

export function getChartTypeOption(type) {
  return chartTypes.find((item) => item.value === type) || chartTypes[0];
}
