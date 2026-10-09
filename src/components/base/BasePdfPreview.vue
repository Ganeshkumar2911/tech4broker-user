<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import BaseIcon from "@/components/base/BaseIcon.vue";

// Configure pdfjs worker via Vite asset URL bundler with fallback
if (typeof window !== "undefined") {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker || "/pdf.worker.min.mjs";
  } catch (e) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "5.6.205"}/build/pdf.worker.min.mjs`;
  }
}

const props = defineProps({
  file: {
    type: [File, Blob, String],
    default: null,
  },
  fileName: {
    type: String,
    default: "Document.pdf",
  },
  fileSizeText: {
    type: String,
    default: "",
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  scrollable: {
    type: Boolean,
    default: true,
  },
  maxHeight: {
    type: String,
    default: "70vh",
  },
});

const emit = defineEmits(["open-external", "update:numPages", "update:zoomScale"]);

const isLoading = ref(false);
const errorMessage = ref("");
const numPages = ref(0);
const zoomScale = ref(1.0);
const pagesContainerRef = ref(null);
const useIframeFallback = ref(false);
const fallbackIframeSrc = ref("");

let activePdfDoc = null;
let currentRenderTasks = [];
let localBlobUrl = null;

async function loadAndRenderPdf() {
  if (!props.file) {
    numPages.value = 0;
    activePdfDoc = null;
    useIframeFallback.value = false;
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";
  useIframeFallback.value = false;
  cancelAllRenderTasks();

  if (localBlobUrl) {
    URL.revokeObjectURL(localBlobUrl);
    localBlobUrl = null;
  }

  try {
    let sourceData = null;

    if (props.file instanceof File || props.file instanceof Blob) {
      localBlobUrl = URL.createObjectURL(props.file);
      fallbackIframeSrc.value = `${localBlobUrl}#toolbar=0&navpanes=0&pagemode=none&view=FitH`;
      const arrayBuffer = await props.file.arrayBuffer();
      sourceData = { data: new Uint8Array(arrayBuffer) };
    } else if (typeof props.file === "string") {
      fallbackIframeSrc.value = `${props.file}#toolbar=0&navpanes=0&pagemode=none&view=FitH`;
      // Try to fetch arrayBuffer directly to avoid CORS worker transfer issues
      try {
        const resp = await fetch(props.file);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          sourceData = { data: new Uint8Array(arrayBuffer) };
        } else {
          sourceData = { url: props.file };
        }
      } catch {
        sourceData = { url: props.file };
      }
    } else {
      throw new Error("Invalid file source");
    }

    const loadingTask = pdfjsLib.getDocument({
      ...sourceData,
      cMapUrl: "https://unpkg.com/pdfjs-dist@5.6.205/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "https://unpkg.com/pdfjs-dist@5.6.205/standard_fonts/",
    });

    const pdfDoc = await loadingTask.promise;
    activePdfDoc = pdfDoc;
    numPages.value = pdfDoc.numPages;
    emit("update:numPages", pdfDoc.numPages);

    await nextTick();
    await renderAllPages();
  } catch (err) {
    console.warn("PDF.js render error, switching to native viewer fallback:", err);
    if (fallbackIframeSrc.value) {
      useIframeFallback.value = true;
    } else {
      errorMessage.value = "Failed to render PDF preview.";
    }
  } finally {
    isLoading.value = false;
  }
}

function cancelAllRenderTasks() {
  for (const task of currentRenderTasks) {
    try {
      task.cancel?.();
    } catch (e) {}
  }
  currentRenderTasks = [];
}

async function renderAllPages() {
  if (!activePdfDoc || !pagesContainerRef.value) return;

  cancelAllRenderTasks();

  for (let pageNum = 1; pageNum <= activePdfDoc.numPages; pageNum++) {
    const canvas = document.getElementById(`pdf-page-canvas-${pageNum}`);
    if (!canvas) continue;

    try {
      const page = await activePdfDoc.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1.0 });

      // Determine container width for fit-to-width calculation with comfortable padding
      const containerWidth = pagesContainerRef.value.clientWidth || 600;
      const sidePadding = Math.min(Math.max(containerWidth * 0.08, 32), 80);
      const targetMaxWidth = 720;
      const maxUsableWidth = Math.min(containerWidth - sidePadding, targetMaxWidth);
      const availableWidth = Math.max(maxUsableWidth, 240);

      const baseFitScale = availableWidth / baseViewport.width;
      const effectiveScale = baseFitScale * zoomScale.value;

      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const viewport = page.getViewport({ scale: effectiveScale * dpr });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${Math.round(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.round(viewport.height / dpr)}px`;

      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      currentRenderTasks.push(renderTask);
      await renderTask.promise;
    } catch (renderErr) {
      if (renderErr?.name !== "RenderingCancelledException") {
        console.warn(`Error rendering page ${pageNum}:`, renderErr);
      }
    }
  }
}

function zoomIn() {
  if (zoomScale.value < 2.5) {
    zoomScale.value = Math.min(2.5, +(zoomScale.value + 0.15).toFixed(2));
    emit("update:zoomScale", zoomScale.value);
    renderAllPages();
  }
}

function zoomOut() {
  if (zoomScale.value > 0.6) {
    zoomScale.value = Math.max(0.6, +(zoomScale.value - 0.15).toFixed(2));
    emit("update:zoomScale", zoomScale.value);
    renderAllPages();
  }
}

function resetZoom() {
  zoomScale.value = 1.0;
  emit("update:zoomScale", zoomScale.value);
  renderAllPages();
}

function handleOpenExternal() {
  emit("open-external");
}

let resizeObserver = null;
onMounted(() => {
  loadAndRenderPdf();

  if (pagesContainerRef.value && typeof ResizeObserver !== "undefined") {
    let resizeTimeout = null;
    resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (activePdfDoc && !useIframeFallback.value) renderAllPages();
      }, 150);
    });
    resizeObserver.observe(pagesContainerRef.value);
  }
});

watch(
  () => props.file,
  () => {
    loadAndRenderPdf();
  },
);

onBeforeUnmount(() => {
  cancelAllRenderTasks();
  if (resizeObserver) resizeObserver.disconnect();
  if (activePdfDoc) {
    try {
      activePdfDoc.destroy?.();
    } catch (e) {}
  }
  if (localBlobUrl) {
    URL.revokeObjectURL(localBlobUrl);
    localBlobUrl = null;
  }
});

defineExpose({
  numPages,
  zoomScale,
  zoomIn,
  zoomOut,
  resetZoom,
  isLoading,
  errorMessage,
  useIframeFallback,
});
</script>

<template>
  <div
    class="w-full flex flex-col"
    :class="showHeader ? 'rounded-xl border border-primary-border bg-card-background overflow-hidden' : ''"
  >
    <!-- PDF Viewer Top Toolbar (Only shown if showHeader is true) -->
    <div
      v-if="showHeader"
      class="px-4 py-2.5 bg-card-background border-b border-primary-border flex items-center justify-between gap-3 flex-wrap"
    >
      <!-- Document Info Badge -->
      <div class="flex items-center gap-2.5 min-w-0">
        <div
          class="w-7 h-7 rounded-lg bg-primary-red/10 text-primary-red flex items-center justify-center shrink-0 border border-primary-red/20"
        >
          <BaseIcon name="picture_as_pdf" :size="16" />
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-primary-text truncate max-w-[200px] sm:max-w-xs" :title="fileName">
            {{ fileName }}
          </p>
          <p class="text-[10px] text-secondary-text flex items-center gap-1.5">
            <span v-if="numPages > 0" class="font-medium text-primary-text">
              {{ numPages }} {{ numPages === 1 ? "Page" : "Pages" }}
            </span>
            <span v-if="fileSizeText">&bull; {{ fileSizeText }}</span>
          </p>
        </div>
      </div>

      <!-- Controls: Zoom & Open -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Zoom Controls -->
        <div v-if="!useIframeFallback" class="flex items-center bg-background border border-primary-border rounded-lg p-0.5">
          <button
            type="button"
            @click.stop="zoomOut"
            :disabled="zoomScale <= 0.6 || isLoading"
            class="p-1 rounded text-secondary-text hover:text-primary-text hover:bg-card-background disabled:opacity-40 transition-colors cursor-pointer"
            title="Zoom out"
          >
            <BaseIcon name="remove" :size="15" />
          </button>
          <button
            type="button"
            @click.stop="resetZoom"
            class="px-2 py-0.5 text-[11px] font-mono text-secondary-text hover:text-primary-text transition-colors cursor-pointer"
            title="Fit to width / Reset zoom"
          >
            {{ Math.round(zoomScale * 100) }}%
          </button>
          <button
            type="button"
            @click.stop="zoomIn"
            :disabled="zoomScale >= 2.5 || isLoading"
            class="p-1 rounded text-secondary-text hover:text-primary-text hover:bg-card-background disabled:opacity-40 transition-colors cursor-pointer"
            title="Zoom in"
          >
            <BaseIcon name="add" :size="15" />
          </button>
        </div>

        <!-- Open in New Tab Button -->
        <button
          type="button"
          @click.stop="handleOpenExternal"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-text bg-background border border-primary-border hover:bg-card-background rounded-lg transition-colors cursor-pointer"
          title="Open PDF in new tab"
        >
          <BaseIcon name="open_in_new" :size="14" />
          <span class="hidden sm:inline">Open in Tab</span>
        </button>
      </div>
    </div>

    <!-- Pages Container Viewport (No visible scrollbars) -->
    <div
      ref="pagesContainerRef"
      class="w-full flex flex-col items-center gap-6 py-4 sm:py-6"
      :class="scrollable ? 'no-scrollbar overflow-y-auto px-4 sm:px-8' : 'px-2 sm:px-4'"
      :style="scrollable ? { maxHeight: maxHeight } : {}"
    >
      <!-- Loading State -->
      <div v-if="isLoading" class="py-16 flex flex-col items-center justify-center gap-3">
        <BaseIcon name="sync" :size="26" class="text-primary-blue animate-spin" />
        <p class="text-xs text-secondary-text font-medium">Loading document pages...</p>
      </div>

      <!-- Error State (Only when both canvas and fallback fail) -->
      <div v-else-if="errorMessage && !useIframeFallback" class="py-12 text-center space-y-2.5">
        <p class="text-xs text-primary-red">{{ errorMessage }}</p>
        <button
          type="button"
          @click.stop="handleOpenExternal"
          class="text-xs text-primary-blue hover:underline font-medium cursor-pointer"
        >
          Open PDF directly in browser
        </button>
      </div>

      <!-- Native Viewer Fallback (Seamless fallback in production if Web Worker is blocked) -->
      <div
        v-else-if="useIframeFallback && fallbackIframeSrc"
        class="w-full h-[65vh] sm:h-[72vh] flex justify-center"
      >
        <iframe
          :src="fallbackIframeSrc"
          class="w-full max-w-3xl h-full border-0 rounded-xl bg-white shadow-xs"
          title="PDF Document Preview"
        />
      </div>

      <!-- PDF Canvas Pages (Clean Flat Paper Cards, Generous Padding, No Shadow) -->
      <template v-else-if="numPages > 0">
        <div
          v-for="pageNum in numPages"
          :key="pageNum"
          class="flex flex-col items-center gap-2.5 w-full"
        >
          <!-- Flat Paper Document Sheet -->
          <div
            class="bg-white rounded-lg border border-primary-border overflow-hidden flex items-center justify-center transition-transform"
          >
            <canvas
              :id="`pdf-page-canvas-${pageNum}`"
              class="block max-w-full h-auto bg-white rounded-lg"
            ></canvas>
          </div>

          <!-- Page Indicator Pill -->
          <span
            class="px-2.5 py-0.5 text-[10px] font-medium text-secondary-text font-mono rounded-full bg-card-background border border-primary-border"
          >
            Page {{ pageNum }} of {{ numPages }}
          </span>
        </div>
      </template>
    </div>
  </div>
</template>
