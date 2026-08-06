import $ from 'blingblingjs'
import { getStyle } from '../utilities/'
import { StyleChange, AttributeChange, BatchChange } from "./history";

let imgs = [],
  overlays = [],
  dragItem;

const state = {
  watching: true,
  historyManager: null,
  imageCache: new Map(), // Cache for loaded images: URL -> Blob URL
};

export function watchImagesForUpload() {
  imgs = $([
    ...document.images,
    ...$("picture"),
    ...findBackgroundImages(document),
  ]);

  clearWatchers(imgs);
  initWatchers(imgs);
}

export function toggleWatching({ watch }) {
  state.watching = watch;
}

export function setHistoryManager(historyManager) {
  state.historyManager = historyManager;
}

const initWatchers = (imgs) => {
  imgs.on("dragover", onDragOver);
  imgs.on("dragleave", onDragLeave);
  imgs.on("drop", onDrop);
  $(document.body).on("dragover", onDragOver);
  $(document.body).on("dragleave", onDragLeave);
  $(document.body).on("drop", onDrop);
  $(document.body).on("dragstart", onDragStart);
  $(document.body).on("dragend", onDragEnd);
};

const clearWatchers = (imgs) => {
  imgs.off("dragover", onDragOver);
  imgs.off("dragleave", onDragLeave);
  imgs.off("drop", onDrop);
  $(document.body).off("dragover", onDragOver);
  $(document.body).off("dragleave", onDragLeave);
  $(document.body).off("drop", onDrop);
  $(document.body).off("dragstart", onDragStart);
  $(document.body).off("dragend", onDragEnd);
  imgs = [];
};

const previewFile = (file) => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => resolve(reader.result);
  });
};

// Cache an image URL as a blob URL for instant loading
const cacheImageURL = async (url) => {
  // If already cached or is a data URL, return as-is
  if (
    state.imageCache.has(url) ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return state.imageCache.get(url) || url;
  }

  try {
    // Fetch the image and convert to blob
    const response = await fetch(url);
    const blob = await response.blob();
    const blobURL = URL.createObjectURL(blob);

    // Cache the blob URL
    state.imageCache.set(url, blobURL);
    return blobURL;
  } catch (error) {
    // If fetch fails, return original URL
    console.warn("Failed to cache image:", url, error);
    return url;
  }
};

// Get cached version of URL or return original
const getCachedImageURL = (url) => {
  return state.imageCache.get(url) || url;
};

// only fired for in-page drag events, track what the user picked up
const onDragStart = ({ target }) => (dragItem = target);

const onDragEnd = (e) => (dragItem = undefined);

const onDragOver = async (e) => {
  e.preventDefault();
  e.stopPropagation();

  const pre_selected = $("img[data-selected=true], [data-selected=true] > img");

  if (imgs.some((img) => img === e.target)) {
    if (!pre_selected.length) {
      if (!isFileEvent(e)) previewDrop(e.target);

      showOverlay(e.currentTarget, 0);
    } else {
      if (pre_selected.some((node) => node == e.target) && !isFileEvent(e))
        pre_selected.forEach((node) => previewDrop(node));

      pre_selected.forEach((img, i) => showOverlay(img, i));
    }
  }
};

const onDragLeave = (e) => {
  e.stopPropagation();
  const pre_selected = $("img[data-selected=true], [data-selected=true] > img");

  if (!pre_selected.some((node) => node === e.target)) resetPreviewed(e.target);
  else pre_selected.forEach((node) => resetPreviewed(node));

  hideOverlays();
};

const onDrop = async (e) => {
  e.stopPropagation();
  e.preventDefault();

  const srcs = await getTransferData(dragItem, e);

  if (srcs.length) {
    const selectedImages = $(
      "img[data-selected=true], [data-selected=true] > img"
    );
    const targetImages = getTargetContentImages(selectedImages, e);

    if (targetImages.length) {
      updateContentImages(targetImages, srcs);
    } else {
      const bgImages = getTargetBackgroundImages(imgs, e);
      updateBackgroundImages(bgImages, srcs[0]);
    }
  }

  hideOverlays();
};

const getTransferData = async (dragItem, e) => {
  if (dragItem) return [dragItem.currentSrc];

  return e.dataTransfer.files.length
    ? await Promise.all(
        [...e.dataTransfer.files]
          .filter((file) => file.type.includes("image"))
          .map(previewFile)
      )
    : [];
};

const getTargetContentImages = (selected, e) =>
  selected.length
    ? selected
    : e.target.nodeName === "IMG" && !selected.length
    ? [e.target]
    : [];

const updateContentImages = async (images, srcs) => {
  // Begin batch if multiple images
  if (images.length > 1 && state.historyManager) {
    state.historyManager.beginBatch();
  }

  let i = 0;
  for (const img of images) {
    clearDragHistory(img);
    await updateContentImage(img, srcs[i]);
    i = ++i % srcs.length;
  }

  // End batch if multiple images
  if (images.length > 1 && state.historyManager) {
    state.historyManager.endBatch();
  }
};

const updateContentImage = async (img, src) => {
  // Record old values for history (use actual current src from DOM)
  const oldSrc = img.getAttribute("src");
  const oldSrcset = img.getAttribute("srcset") || "";

  // Cache the old image URL for instant undo
  if (oldSrc && !oldSrc.startsWith("data:") && !oldSrc.startsWith("blob:")) {
    cacheImageURL(oldSrc).catch(() => {}); // Cache in background, ignore errors
  }

  // Use cached version of new src if available, otherwise cache it
  let cachedSrc = src;
  if (!src.startsWith("data:") && !src.startsWith("blob:")) {
    cachedSrc = await cacheImageURL(src);
  }

  // Update image with cached version
  img.src = cachedSrc;
  if (img.srcset !== "") img.srcset = cachedSrc;

  // Record changes in history (store the cached URLs for instant undo/redo)
  if (state.historyManager) {
    state.historyManager.push(
      new AttributeChange({
        element: img,
        attribute: "src",
        oldValue: getCachedImageURL(oldSrc) || oldSrc,
        newValue: cachedSrc,
      })
    );

    if (oldSrcset !== "") {
      state.historyManager.push(
        new AttributeChange({
          element: img,
          attribute: "srcset",
          oldValue: getCachedImageURL(oldSrcset) || oldSrcset,
          newValue: cachedSrc,
        })
      );
    }
  }

  const sources = getPictureSourcesToUpdate(img);

  if (sources.length && state.historyManager) {
    sources.forEach((source) => {
      const oldSourceSrcset = source.getAttribute("srcset");
      source.srcset = cachedSrc;

      state.historyManager.push(
        new AttributeChange({
          element: source,
          attribute: "srcset",
          oldValue: getCachedImageURL(oldSourceSrcset) || oldSourceSrcset,
          newValue: cachedSrc,
        })
      );
    });
  }
};

const getTargetBackgroundImages = (images, e) =>
  images.filter((img) => img.contains(e.target));

const updateBackgroundImages = (images, src) => {
  // Begin batch if multiple images
  if (images.length > 1 && state.historyManager) {
    state.historyManager.beginBatch();
  }

  images.forEach((img) => {
    clearDragHistory(img);
    if (window.getComputedStyle(img).backgroundImage != "none") {
      const oldBackgroundImage = img.style.backgroundImage;
      const newBackgroundImage = `url(${src})`;

      // Record style change
      if (state.historyManager) {
        state.historyManager.push(
          new StyleChange({
            element: img,
            property: "backgroundImage",
            oldValue: oldBackgroundImage,
            newValue: newBackgroundImage,
          })
        );
      }

      img.style.backgroundImage = newBackgroundImage;
    }
  });

  // End batch if multiple images
  if (images.length > 1 && state.historyManager) {
    state.historyManager.endBatch();
  }
};

const getPictureSourcesToUpdate = (img) =>
  Array.from(img.parentElement.children)
    .filter((sibling) => sibling.nodeName === "SOURCE")
    .filter(
      (source) => !source.media || window.matchMedia(source.media).matches
    );

const showOverlay = (node, i) => {
  if (!state.watching) return;

  const rect = node.getBoundingClientRect();
  const overlay = overlays[i];

  if (overlay) {
    overlay.update = rect;
  } else {
    overlays[i] = document.createElement("visbug-overlay");
    overlays[i].position = rect;
    document.body.appendChild(overlays[i]);
  }
};

const hideOverlays = () => {
  overlays.forEach((overlay) => overlay.remove());
  overlays = [];
};

const findBackgroundImages = (el) => {
  const src_regex = /url\(\s*?['"]?\s*?(\S+?)\s*?["']?\s*?\)/i;

  return $("*").reduce((collection, node) => {
    const prop = getStyle(node, "background-image");
    const match = src_regex.exec(prop);

    // if (match) collection.push(match[1])
    if (match) collection.push(node);

    return collection;
  }, []);
};

const previewDrop = async (node) => {
  if (
    !["lastSrc", "lastSrcset", "lastSiblings", "lastBackgroundImage"].some(
      (prop) => node[prop]
    )
  ) {
    const setSrc = dragItem.currentSrc;
    if (window.getComputedStyle(node).backgroundImage !== "none") {
      node.lastBackgroundImage = window.getComputedStyle(node).backgroundImage;
      node.style.backgroundImage = `url(${setSrc})`;
    } else {
      cacheImageState(node);
      // Preview update without history recording
      node.src = setSrc;
      if (node.srcset !== "") node.srcset = setSrc;

      const sources = getPictureSourcesToUpdate(node);
      if (sources.length) {
        sources.forEach((source) => {
          source.srcset = setSrc;
        });
      }
    }
  }
};

const cacheImageState = image => {
  image.lastSrc    = image.src
  image.lastSrcset = image.srcset

  const sibSource  = getPictureSourcesToUpdate(image)

  if (sibSource.length) {
    sibSource.forEach(sib => {
      sib.lastSrcset = sib.srcset
      sib.lastSrc = sib.src
    })
  }
}

const resetPreviewed = node => {
  if (node.lastSrc)
    node.src = node.lastSrc

  if (node.lastSrcset)
    node.srcset = node.lastSrcset

  const sources = getPictureSourcesToUpdate(node)
  if (sources.length)
    sources.forEach(source => {
      if (source.lastSrcset)
        source.srcset = source.lastSrcset
      if (source.lastSrc)
        source.src = source.lastSrc
    })

  if (node.lastBackgroundImage)
    node.style.backgroundImage = node.lastBackgroundImage

  clearDragHistory(node)
}

const clearDragHistory = node => {
  ['lastSrc','lastSrcset','lastBackgroundImage'].forEach(prop =>
    node[prop] = null)

  const sources = getPictureSourcesToUpdate(node)

  if (sources){
    sources.forEach(source => {
      source.lastSrcset = null
      source.lastSrc = null
    })
  }
}

const isFileEvent = e =>
  e.dataTransfer.types.some(type => type === 'Files')
