import type { Ref } from "vue";

export interface SlideBlok {
  _uid: string;
  component: string;
  [k: string]: any;
}

/**
 * All slideshow state + behaviour (navigation, fullscreen, auto-hiding
 * controls, keyboard shortcuts). Instantiate once in the slideshow root and
 * pass the returned controller down to the presentation components.
 */
export interface SlideshowController {
  slides: Ref<SlideBlok[]>;
  total: Ref<number>;
  current: Ref<number>;
  currentSlide: Ref<SlideBlok | undefined>;
  progressPct: Ref<number>;
  presenting: Ref<boolean>;
  showHelp: Ref<boolean>;
  showGrid: Ref<boolean>;
  isFullscreen: Ref<boolean>;
  controlsVisible: Ref<boolean>;
  transitionName: Ref<"slide-next" | "slide-prev">;
  stageEl: Ref<HTMLElement | null>;
  goto: (i: number) => void;
  next: () => void;
  prev: () => void;
  first: () => void;
  last: () => void;
  startPresenting: (i: number) => void;
  stopPresenting: () => void;
  toggleFullscreen: () => void;
  bumpControls: () => void;
}

export function useSlideshow(slides: Ref<SlideBlok[]>): SlideshowController {
  const total = computed(() => slides.value.length);
  const current = ref(0);
  const presenting = ref(false);
  const showHelp = ref(false);
  const showGrid = ref(false);
  const isFullscreen = ref(false);
  const transitionName = ref<"slide-next" | "slide-prev">("slide-next");
  const stageEl = ref<HTMLElement | null>(null);

  const currentSlide = computed(() => slides.value[current.value]);
  const progressPct = computed(() =>
    total.value > 1 ? (current.value / (total.value - 1)) * 100 : 100,
  );

  /* ---- navigation ----------------------------------------------------- */
  function goto(i: number) {
    const target = Math.max(0, Math.min(total.value - 1, i));
    transitionName.value =
      target >= current.value ? "slide-next" : "slide-prev";
    current.value = target;
  }
  const next = () => current.value < total.value - 1 && goto(current.value + 1);
  const prev = () => current.value > 0 && goto(current.value - 1);
  const first = () => goto(0);
  const last = () => goto(total.value - 1);

  /* ---- presentation lifecycle ----------------------------------------- */
  function startPresenting(i: number) {
    current.value = i;
    presenting.value = true;
    document.body.style.overflow = "hidden";
    // request real fullscreen + focus the overlay once it's in the DOM
    requestAnimationFrame(() => {
      stageEl.value?.focus();
      enterFullscreen();
    });
  }
  function stopPresenting() {
    presenting.value = false;
    showHelp.value = false;
    showGrid.value = false;
    document.body.style.overflow = "";
    exitFullscreen();
  }

  /* ---- fullscreen ----------------------------------------------------- */
  function enterFullscreen() {
    const el = stageEl.value;
    if (el && !document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    }
  }
  function exitFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }
  function toggleFullscreen() {
    if (document.fullscreenElement) exitFullscreen();
    else enterFullscreen();
  }
  const onFsChange = () => (isFullscreen.value = !!document.fullscreenElement);

  /* ---- auto-hiding controls ------------------------------------------- */
  const controlsVisible = ref(true);
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  function bumpControls() {
    controlsVisible.value = true;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (!showHelp.value && !showGrid.value) controlsVisible.value = false;
    }, 2500);
  }

  /* ---- keyboard ------------------------------------------------------- */
  function onKey(e: KeyboardEvent) {
    if (!presenting.value) return;
    bumpControls();

    if (e.key === "Escape") {
      if (showHelp.value) return void (showHelp.value = false);
      if (showGrid.value) return void (showGrid.value = false);
      return stopPresenting();
    }

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case " ":
      case "PageDown":
      case "n":
        e.preventDefault();
        next();
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
      case "p":
        e.preventDefault();
        prev();
        break;
      case "Home":
        e.preventDefault();
        first();
        break;
      case "End":
        e.preventDefault();
        last();
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      case "g":
      case "G":
        showGrid.value = !showGrid.value;
        break;
      case "?":
      case "/":
        showHelp.value = !showHelp.value;
        break;
    }
  }

  watch(presenting, (on) => {
    if (on) {
      window.addEventListener("keydown", onKey);
      document.addEventListener("fullscreenchange", onFsChange);
      bumpControls();
    } else {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFsChange);
      clearTimeout(hideTimer);
    }
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", onKey);
    document.removeEventListener("fullscreenchange", onFsChange);
    clearTimeout(hideTimer);
    document.body.style.overflow = "";
  });

  return {
    slides,
    total,
    current,
    currentSlide,
    progressPct,
    presenting,
    showHelp,
    showGrid,
    isFullscreen,
    controlsVisible,
    transitionName,
    stageEl,
    goto,
    next,
    prev,
    first,
    last,
    startPresenting,
    stopPresenting,
    toggleFullscreen,
    bumpControls,
  };
}
