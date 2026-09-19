"use strict";

// Resource URLs live in the clearly marked #resources block in index.html.
// An absent href keeps the resource disabled, even if its local asset exists.
for (const source of document.querySelectorAll("#resources [data-resource]")) {
  const url = source.getAttribute("href");
  const available = Boolean(url && url.trim() && url.trim() !== "#");
  if (available) {
    source.removeAttribute("aria-disabled");
    source.removeAttribute("title");
    source.querySelector(".sr-only")?.remove();
  } else {
    source.removeAttribute("href");
    source.setAttribute("aria-disabled", "true");
  }
  for (const mirror of document.querySelectorAll(`[data-resource-mirror="${source.dataset.resource}"]`)) {
    if (available) {
      mirror.setAttribute("href", url);
      mirror.removeAttribute("aria-disabled");
    } else {
      mirror.removeAttribute("href");
      mirror.setAttribute("aria-disabled", "true");
    }
  }
}

// Figure links remain usable as ordinary image links without JavaScript.
const dialog = document.querySelector(".figure-dialog");
if (dialog && typeof dialog.showModal === "function") {
  const viewport = dialog.querySelector(".dialog-viewport");
  const enlarged = dialog.querySelector(".dialog-image");
  const caption = dialog.querySelector(".dialog-caption");
  const original = dialog.querySelector(".dialog-original");
  const zoom = dialog.querySelector(".dialog-zoom");
  let trigger = null;

  const setZoom = (isZoomed) => {
    viewport.classList.toggle("is-zoomed", isZoomed);
    zoom.setAttribute("aria-pressed", String(isZoomed));
    zoom.textContent = isZoomed ? "Fit to screen" : "Zoom in";
    viewport.scrollTo(0, 0);
  };

  for (const link of document.querySelectorAll("[data-figure]")) {
    link.setAttribute("aria-haspopup", "dialog");
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      const source = link.querySelector("img");
      enlarged.src = link.href;
      enlarged.alt = source.alt;
      // At least 900px when zoomed, so a single-column plot also enlarges.
      viewport.style.setProperty("--figure-width", `${Math.max(source.naturalWidth, 900)}px`);
      const sourceCaption = link.closest("figure")?.querySelector("figcaption")?.cloneNode(true);
      if (sourceCaption) {
        // Flatten paragraph/heading wrappers while preserving italic p and subscripts.
        sourceCaption.querySelectorAll("h3, p").forEach((block) => {
          block.replaceWith(...block.childNodes, document.createTextNode(" "));
        });
        caption.replaceChildren(...sourceCaption.childNodes);
      } else {
        caption.textContent = link.dataset.caption;
      }
      original.href = link.href;
      setZoom(false);
      dialog.showModal();
      document.body.classList.add("dialog-open");
      dialog.querySelector(".dialog-close").focus();
    });
  }
  zoom.addEventListener("click", () => setZoom(!viewport.classList.contains("is-zoomed")));
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    setZoom(false);
    trigger?.focus({ preventScroll: true });
  });
}
