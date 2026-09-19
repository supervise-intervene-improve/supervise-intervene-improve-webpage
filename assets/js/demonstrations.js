"use strict";

// DEMONSTRATION SOURCES: relative URLs, grouped by study, card, and environment.
// VR-PointCloud and Kinesthetic Teaching intentionally share the same two files.
const demonstrations = {
  supervision: {
    "desktop-rgb": {
      label: "Desktop-RGB", context: "Kinesthetic Teaching",
      videos: { cups: "assets/videos/demonstrations/desktop-rgb-kt-cups.mp4", tshape: "assets/videos/demonstrations/desktop-rgb-kt-tshape.mp4" }
    },
    "vr-rgb": {
      label: "VR-RGB", context: "Kinesthetic Teaching",
      videos: { cups: "assets/videos/demonstrations/vr-rgb-kt-cups.mp4", tshape: "assets/videos/demonstrations/vr-rgb-kt-tshape.mp4" }
    },
    "vr-pointcloud": {
      label: "VR-PointCloud", context: "Kinesthetic Teaching",
      videos: { cups: "assets/videos/demonstrations/vr-pointcloud-kt-cups.mp4", tshape: "assets/videos/demonstrations/vr-pointcloud-kt-tshape.mp4" }
    }
  },
  control: {
    kt: {
      label: "Kinesthetic Teaching", context: "VR-PointCloud",
      videos: { cups: "assets/videos/demonstrations/vr-pointcloud-kt-cups.mp4", tshape: "assets/videos/demonstrations/vr-pointcloud-kt-tshape.mp4" }
    },
    mc: {
      label: "Motion Controller", context: "VR-PointCloud",
      videos: { cups: "assets/videos/demonstrations/vr-pointcloud-mc-cups.mp4", tshape: "assets/videos/demonstrations/vr-pointcloud-mc-tshape.mp4" }
    },
    factr: {
      label: "FACTR", context: "VR-PointCloud",
      videos: { cups: "assets/videos/demonstrations/vr-pointcloud-factr-cups.mp4", tshape: "assets/videos/demonstrations/vr-pointcloud-factr-tshape.mp4" }
    }
  }
};

const demoEnvironments = { cups: "Cups", tshape: "T-Shape Assembly" };
const demoPlayers = new Set();
const demoReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
// Each poster is an unchanged frame from the corresponding recording.
const demonstrationPoster = (source) => source.replace("assets/videos/", "assets/images/").replace(/\.mp4$/, ".webp");

function initializeDemonstrations(study, cards) {
  const section = document.getElementById(study);
  const disclosure = section?.querySelector(".demo-disclosure");
  const template = document.getElementById("demo-content-template");
  // Progressive enhancement: never reveal bare controls if component CSS fails.
  if (!disclosure || !template || getComputedStyle(disclosure).getPropertyValue("--demo-component-ready").trim() !== "1") return false;

  const triggers = [...section.querySelectorAll("[data-demo-trigger]")];
  const panel = disclosure.querySelector(".demo-panel");
  const content = template.content.firstElementChild.cloneNode(true);
  const title = content.querySelector(".demo-title");
  const video = content.querySelector("video");
  const stage = content.querySelector(".demo-video-stage");
  const ambient = content.querySelector(".demo-ambient");
  const snapshot = content.querySelector(".demo-crossfade");
  const ambientContext = ambient.getContext("2d");
  const snapshotContext = snapshot.getContext("2d");
  const tabs = [...content.querySelectorAll("[data-demo-task]")];
  const taskPanels = [...content.querySelectorAll("[data-demo-task-panel]")];
  const caption = content.querySelector(".demo-caption");
  const error = content.querySelector(".demo-error");
  let activeTrigger = null;
  let activeTask = null;
  let currentPoster = null;
  let portrait = false;
  let mediaVersion = 0;
  let ambientFrame = 0;
  let lastFrame = 0;
  let fadeTimer = 0;
  let revealFrame = 0;

  panel.append(content);
  title.id = `demo-${study}-title`;
  caption.id = `demo-${study}-caption`;
  video.setAttribute("aria-describedby", caption.id);
  demoPlayers.add(video);
  for (const tab of tabs) {
    const task = tab.dataset.demoTask;
    tab.id = `demo-${study}-tab-${task}`;
    tab.setAttribute("aria-controls", `demo-${study}-task-panel-${task}`);
    const taskPanel = taskPanels.find((item) => item.dataset.demoTaskPanel === task);
    taskPanel.id = `demo-${study}-task-panel-${task}`;
    taskPanel.setAttribute("aria-labelledby", tab.id);
    taskPanel.tabIndex = 0;
  }

  function drawFrame(context, source, width, height, cover = false) {
    const sourceWidth = source.videoWidth || source.naturalWidth;
    const sourceHeight = source.videoHeight || source.naturalHeight;
    if (!sourceWidth || !sourceHeight) return;
    const fit = cover ? Math.max : Math.min;
    const scale = fit(width / sourceWidth, height / sourceHeight);
    const drawnWidth = sourceWidth * scale;
    const drawnHeight = sourceHeight * scale;
    context.drawImage(source, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight);
  }

  function visibleFrame() {
    // Before first playback, some browsers expose an undecoded video frame.
    // Use the matching poster until the player has presented an actual frame.
    return video.readyState >= 2 && video.videoWidth && (!video.paused || video.currentTime > 0) ? video : currentPoster;
  }

  function paintAmbient(source = visibleFrame()) {
    if (!source || !ambientContext) return;
    const width = source.videoWidth || source.naturalWidth;
    const height = source.videoHeight || source.naturalHeight;
    portrait = height > width;
    stage.classList.toggle("is-portrait", portrait);
    if (!portrait) return;
    ambientContext.clearRect(0, 0, ambient.width, ambient.height);
    drawFrame(ambientContext, source, ambient.width, ambient.height, true);
  }

  function stopAmbient() {
    cancelAnimationFrame(ambientFrame);
    ambientFrame = 0;
  }

  function animateAmbient(time) {
    if (video.paused || video.ended || !activeTrigger || !portrait || demoReducedMotion.matches) { stopAmbient(); return; }
    // A small, blurred canvas mirrors the selected player; no second media stream.
    if (time - lastFrame > 83) { paintAmbient(); lastFrame = time; }
    ambientFrame = requestAnimationFrame(animateAmbient);
  }

  function captureOutgoing() {
    const source = visibleFrame();
    if (!source || !snapshotContext || demoReducedMotion.matches) return false;
    const width = snapshot.width;
    const height = snapshot.height;
    snapshotContext.fillStyle = "#18212b";
    snapshotContext.fillRect(0, 0, width, height);
    if (portrait) {
      snapshotContext.save();
      snapshotContext.filter = "blur(24px) brightness(.5) saturate(.65)";
      drawFrame(snapshotContext, source, width, height, true);
      snapshotContext.restore();
    }
    drawFrame(snapshotContext, source, width, height);
    stage.classList.add("is-switching");
    snapshot.getBoundingClientRect();
    return true;
  }

  function finishFade(version) {
    if (version !== mediaVersion) return;
    clearTimeout(fadeTimer);
    cancelAnimationFrame(revealFrame);
    // Two frames give the selected poster time to paint beneath the outgoing frame.
    revealFrame = requestAnimationFrame(() => {
      revealFrame = requestAnimationFrame(() => {
        if (version === mediaVersion) stage.classList.remove("is-switching");
      });
    });
  }

  function stopVideo() {
    ++mediaVersion;
    stopAmbient();
    clearTimeout(fadeTimer);
    cancelAnimationFrame(revealFrame);
    video.pause();
    video.removeAttribute("src");
    video.preload = "metadata";
    video.load();
    error.hidden = true;
  }

  function pauseOtherPlayers() {
    for (const player of demoPlayers) if (player !== video) player.pause();
  }

  function updateOrigin() {
    if (!activeTrigger) return;
    const cardBounds = activeTrigger.closest("figure").getBoundingClientRect();
    const panelBounds = panel.getBoundingClientRect();
    const offset = cardBounds.left + cardBounds.width / 2 - panelBounds.left;
    disclosure.style.setProperty("--demo-origin", `${Math.max(20, Math.min(offset, panelBounds.width - 20))}px`);
  }

  function selectEnvironment(task, switchingCard = false) {
    if (!activeTrigger || (!switchingCard && task === activeTask && video.getAttribute("src"))) return;
    const config = cards[activeTrigger.dataset.demoKey];
    const source = config.videos[task];
    if (!source) return;
    const crossfade = !!video.getAttribute("src") && captureOutgoing();
    stopVideo();
    const version = mediaVersion;
    activeTask = task;
    currentPoster = null;
    for (const tab of tabs) {
      const selected = tab.dataset.demoTask === task;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    for (const taskPanel of taskPanels) {
      taskPanel.hidden = taskPanel.dataset.demoTaskPanel !== task;
      if (!taskPanel.hidden) taskPanel.append(stage);
    }
    const environment = document.createElement("span");
    environment.className = "demo-caption-task";
    environment.textContent = demoEnvironments[task];
    const context = document.createElement("span");
    context.className = "demo-caption-context";
    context.textContent = config.context;
    caption.replaceChildren(environment, context);
    video.setAttribute("aria-label", `${config.label} video demonstration: ${demoEnvironments[task]}`);
    const poster = new Image();
    poster.onload = () => {
      if (version !== mediaVersion) return;
      currentPoster = poster;
      paintAmbient(poster);
      finishFade(version);
    };
    poster.onerror = () => finishFade(version);
    poster.src = demonstrationPoster(source);
    video.poster = poster.src;
    video.preload = "metadata";
    video.src = source;
    error.querySelector("a").href = source;
    video.load();
    if (crossfade) fadeTimer = setTimeout(() => finishFade(version), 1200);
    else stage.classList.remove("is-switching");
  }

  function updateTriggers() {
    for (const trigger of triggers) {
      const expanded = trigger === activeTrigger;
      trigger.setAttribute("aria-expanded", String(expanded));
      trigger.querySelector("[data-demo-label]").textContent = expanded ? "Hide demonstration" : "Video demonstration";
      trigger.closest("figure").classList.toggle("is-demo-active", expanded);
    }
  }

  function close() {
    if (!activeTrigger) return;
    const owner = activeTrigger;
    if (disclosure.contains(document.activeElement)) owner.focus({ preventScroll: true });
    stopVideo();
    stage.classList.remove("is-switching");
    activeTrigger = null;
    activeTask = null;
    updateTriggers();
    disclosure.inert = true;
    disclosure.setAttribute("aria-hidden", "true");
    disclosure.classList.remove("is-open");
  }

  function open(trigger) {
    if (trigger === activeTrigger) { close(); return; }
    const config = cards[trigger.dataset.demoKey];
    if (!config) return;
    pauseOtherPlayers();
    activeTrigger = trigger;
    title.textContent = config.label;
    panel.setAttribute("aria-labelledby", title.id);
    content.querySelector(".demo-close").setAttribute("aria-label", `Close ${config.label} demonstration`);
    tabs.forEach((tab) => { tab.hidden = !config.videos[tab.dataset.demoTask]; });
    content.querySelector(".demo-tabs").hidden = Object.keys(config.videos).length < 2;
    selectEnvironment(config.videos.cups ? "cups" : Object.keys(config.videos)[0], true);
    updateTriggers();
    disclosure.inert = false;
    disclosure.setAttribute("aria-hidden", "false");
    disclosure.getBoundingClientRect();
    disclosure.classList.add("is-open");
    updateOrigin();
    requestAnimationFrame(() => {
      if (activeTrigger !== trigger) return;
      const rect = disclosure.getBoundingClientRect();
      if (rect.top > window.innerHeight - 140) {
        window.scrollTo({ top: window.scrollY + rect.top - 24, behavior: demoReducedMotion.matches ? "instant" : "smooth" });
      }
    });
  }

  for (const trigger of triggers) {
    if (!cards[trigger.dataset.demoKey]) continue;
    trigger.hidden = false;
    trigger.addEventListener("click", () => open(trigger));
  }
  for (const tab of tabs) tab.addEventListener("click", () => selectEnvironment(tab.dataset.demoTask));
  content.querySelector(".demo-tabs").addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const available = tabs.filter((tab) => !tab.hidden);
    const current = available.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    let next = event.key === "ArrowRight" ? (current + 1) % available.length : (current - 1 + available.length) % available.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = available.length - 1;
    available[next].focus({ preventScroll: true });
    selectEnvironment(available[next].dataset.demoTask);
  });
  content.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.fullscreenElement) { event.preventDefault(); close(); }
  });
  content.querySelector(".demo-close").addEventListener("click", close);
  video.addEventListener("play", () => {
    pauseOtherPlayers();
    stopAmbient();
    ambientFrame = requestAnimationFrame(animateAmbient);
  });
  video.addEventListener("pause", stopAmbient);
  video.addEventListener("ended", stopAmbient);
  video.addEventListener("loadeddata", () => {
    if (!activeTrigger || video.readyState < 2) return;
    paintAmbient();
    finishFade(mediaVersion);
  });
  video.addEventListener("seeked", () => paintAmbient());
  video.addEventListener("error", () => {
    if (activeTrigger && video.getAttribute("src")) { error.hidden = false; finishFade(mediaVersion); }
  });
  window.addEventListener("resize", updateOrigin, { passive: true });
}

// Initialize each study once its component CSS has been applied. If the stylesheet
// is not ready when this script runs, retry after the page has fully loaded.
const initializedStudies = new Set();
function initializeAllDemonstrations() {
  for (const [study, cards] of Object.entries(demonstrations)) {
    if (!initializedStudies.has(study) && initializeDemonstrations(study, cards) !== false) initializedStudies.add(study);
  }
}
initializeAllDemonstrations();
if (initializedStudies.size < Object.keys(demonstrations).length) {
  if (document.readyState === "complete") requestAnimationFrame(initializeAllDemonstrations);
  else window.addEventListener("load", initializeAllDemonstrations, { once: true });
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) for (const player of demoPlayers) player.pause();
});
