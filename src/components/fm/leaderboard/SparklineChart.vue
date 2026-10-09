<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  data: { type: Array, default: () => [] },
  positive: { type: Boolean, default: true },
});

const canvasRef = ref(null);
let chart = null;

onMounted(async () => {
  const {
    Chart,
    LineController, // ✅ was missing — this is the "line" controller
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler,
  } = await import("chart.js");

  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Filler,
  );

  if (!canvasRef.value) return;

  const ctx = canvasRef.value.getContext("2d");
  const color = props.positive ? "#22c55e" : "#ef4444";
  const gradient = ctx.createLinearGradient(0, 0, 0, 80);
  gradient.addColorStop(
    0,
    props.positive ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)",
  );
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: props.data.map((_, i) => i),
      datasets: [
        {
          data: props.data,
          borderColor: color,
          borderWidth: 1.5,
          fill: true,
          backgroundColor: gradient,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      animation: false,
    },
  });
});

onBeforeUnmount(() => chart?.destroy());
</script>

<template>
  <div class="h-20 w-full">
    <canvas ref="canvasRef" />
  </div>
</template>
