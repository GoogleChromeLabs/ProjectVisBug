import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'

import { preferredNotation } from './color'
import { canMoveLeft, canMoveRight, canMoveUp } from './move'
import { watchImagesForUpload, setHistoryManager as setImageSwapHistoryManager } from './imageswap'
import { queryPage } from './search'
import { createMeasurements, clearMeasurements } from './measurements'
import { createMarginVisual } from './margin'
import { createPaddingVisual } from './padding'
import { DOMChange, StyleChange, AttributeChange, TextChange } from "./history";

import {
  showTip as showMetaTip,
  removeAll as removeAllMetaTips,
} from "./metatip";
import {
  showTip as showAccessibilityTip,
  removeAll as removeAllAccessibilityTips,
} from "./accessibility";

import {
  metaKey,
  htmlStringToDom,
  createClassname,
  camelToDash,
  isOffBounds,
  getStyle,
  getStyles,
  deepElementFromPoint,
  getShadowValues,
  isSelectorValid,
  findNearestChildElement,
  findNearestParentElement,
  getTextShadowValues,
  isFixed,
  onRemove,
} from "../utilities/";

export function Selectable(visbug) {
  const page = document.body;
  const historyManager = visbug.historyManager;
  
  // Set historyManager for imageswap feature
  if (historyManager) {
    setImageSwapHistoryManager(historyManager);
  }
  
  let selected = [];
  let selectedCallbacks = [];
  let labels = [];
  let handles = [];

  const hover_state = {
    target: null,
    element: null,
    label: null,
  };

  const listen = () => {
    page.addEventListener("click", on_click, true);
    page.addEventListener("dblclick", on_dblclick, true);

    page.on("selectstart", on_selection);
    page.on("mousemove", on_hover);
    document.addEventListener("copy", on_copy);
    document.addEventListener("cut", on_cut);
    document.addEventListener("paste", on_paste);

    watchCommandKey();

    // TODO: These hotkeys needs to go under undo redo process (inj-src)
    hotkeys(`${metaKey}+alt+c`, on_copy_styles);
    hotkeys(`${metaKey}+alt+v`, (e) => on_paste_styles());
    hotkeys("esc", on_esc);
    hotkeys(`${metaKey}+d`, on_duplicate);
    hotkeys("backspace,del,delete", on_delete);
    hotkeys("alt+del,alt+backspace", on_clearstyles);
    hotkeys(`${metaKey}+e,${metaKey}+shift+e`, on_expand_selection);
    hotkeys(`${metaKey}+g,${metaKey}+shift+g`, on_group);
    hotkeys("tab,shift+tab,enter,shift+enter", on_keyboard_traversal);
    hotkeys(`${metaKey}+shift+enter`, on_select_children);
    hotkeys(`shift+'`, on_select_parent);
  };

  const unlisten = () => {
    page.removeEventListener("click", on_click, true);
    page.removeEventListener("dblclick", on_dblclick, true);

    page.off("selectstart", on_selection);
    page.off("mousemove", on_hover);

    document.removeEventListener("copy", on_copy);
    document.removeEventListener("cut", on_cut);
    document.removeEventListener("paste", on_paste);

    hotkeys.unbind(
      `esc,${metaKey}+d,backspace,del,delete,alt+del,alt+backspace,${metaKey}+e,${metaKey}+shift+e,${metaKey}+g,${metaKey}+shift+g,tab,shift+tab,enter,shift+enter`
    );
  };

  const on_click = (e) => {
    const $target = deepElementFromPoint(e.clientX, e.clientY);

    if (isOffBounds($target) && !selected.filter((el) => el == $target).length)
      return;

    e.preventDefault();
    if (!e.altKey) e.stopPropagation();

    if (!e.shiftKey) {
      unselect_all({ silent: true });
      clearMeasurements();
    }

    if (e.shiftKey && $target.hasAttribute("data-selected"))
      unselect($target.getAttribute("data-label-id"));
    else select($target);
  };

  const unselect = (id) => {
    [...labels, ...handles]
      .filter((node) => node.getAttribute("data-label-id") === id)
      .forEach((node) => node.remove());

    selected
      .filter((node) => node.getAttribute("data-label-id") === id)
      .forEach((node) =>
        $(node).attr({
          "data-selected": null,
          "data-selected-hide": null,
          "data-label-id": null,
          "data-pseudo-select": null,
          "data-measuring": null,
          "data-outward": null,
        })
      );

    selected = selected.filter(
      (node) => node.getAttribute("data-label-id") !== id
    );

    tellWatchers();
  };

  const on_dblclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOffBounds(e.target)) return;
    visbug.toolSelected("text");
  };

  const watchCommandKey = (e) => {
    let did_hide = false;

    document.onkeydown = function (e) {
      if (hotkeys.ctrl && selected.length) {
        $("visbug-handles, visbug-label, visbug-hover, visbug-grip").forEach(
          (el) => (el.style.display = "none")
        );

        did_hide = true;
      }
    };

    document.onkeyup = function (e) {
      if (did_hide) {
        $("visbug-handles, visbug-label, visbug-hover, visbug-grip").forEach(
          (el) => (el.style.display = null)
        );

        did_hide = false;
      }
    };
  };

  const on_esc = (_) => unselect_all();

  const on_duplicate = (e) => {
    const root_node = selected[0];
    if (!root_node) return;

    const deep_clone = root_node.cloneNode(true);
    deep_clone.removeAttribute("data-selected");

    // Capture position before insertion
    const parent = root_node.parentNode;
    const nextSibling = root_node.nextSibling;

    root_node.parentNode.insertBefore(deep_clone, root_node.nextSibling);

    // Record the DOM change (insertion)
    if (historyManager) {
      historyManager.push(
        new DOMChange({
          element: deep_clone,
          oldParent: null, // Element didn't exist before
          oldNextSibling: null,
          newParent: parent,
          newNextSibling: nextSibling,
        })
      );
    }

    e.preventDefault();
  };

  const on_delete = (e) => {
    if (!selected.length) return;

    // Begin batch if multiple elements
    if (selected.length > 1 && historyManager) {
      historyManager.beginBatch();
    }

    // Record each deletion before they're removed
    selected.forEach((el) => {
      if (historyManager) {
        historyManager.push(
          new DOMChange({
            element: el,
            oldParent: el.parentNode,
            oldNextSibling: el.nextElementSibling,
            newParent: null, // Element is being removed
            newNextSibling: null,
          })
        );
      }
    });

    // End batch before actual deletion
    if (selected.length > 1 && historyManager) {
      historyManager.endBatch();
    }

    // Now perform the actual deletion
    delete_all();
  };
  // After change this might not work as intended
  const on_clearstyles = (e) => {
    if (selected.length > 1 && historyManager) {
      historyManager.beginBatch();
    }

    selected.forEach((el) => {
      const oldStyle = el.getAttribute("style");

      if (historyManager && oldStyle) {
        historyManager.push(
          new AttributeChange({
            element: el,
            attribute: "style",
            oldValue: oldStyle,
            newValue: null,
          })
        );
      }

      el.attr("style", null);
    });

    if (selected.length > 1 && historyManager) {
      historyManager.endBatch();
    }
  };

  const on_copy = async (e) => {
    // if user has selected text, dont try to copy an element
    if (window.getSelection().toString().length) return;

    if (selected[0] && window.node_clipboard !== selected[0]) {
      e.preventDefault();
      let $node = selected[0].cloneNode(true);
      $node.removeAttribute("data-selected");

      window.copy_backup = $node.outerHTML;
      e.clipboardData.setData("text/html", window.copy_backup);

      const { state } = await navigator.permissions.query({
        name: "clipboard-write",
      });

      if (state === "granted")
        await navigator.clipboard.writeText(window.copy_backup);
    }
  };

  // why the logic is dealing with only the first element?
  const on_cut = (e) => {
    if (selected[0] && window.node_clipboard !== selected[0]) {
      let $node = selected[0].cloneNode(true);
      $node.removeAttribute("data-selected");
      window.copy_backup = $node.outerHTML;
      e.clipboardData.setData("text/html", window.copy_backup);

      // Record the deletion
      if (historyManager) {
        historyManager.push(
          new DOMChange({
            element: selected[0],
            oldParent: selected[0].parentNode,
            oldNextSibling: selected[0].nextElementSibling,
            newParent: null,
            newNextSibling: null,
          })
        );
      }

      selected[0].remove();
    }
  };

  const on_paste = async (e, index = 0) => {
    const clipData = e.clipboardData.getData("text/html");
    const globalClipboard = await navigator.clipboard.readText();
    const potentialHTML = clipData || globalClipboard || window.copy_backup;

    if (selected.length && potentialHTML) {
      e.preventDefault();

      // Begin batch if multiple elements
      if (selected.length > 1 && historyManager) {
        historyManager.beginBatch();
      }

      selected.forEach((el) => {
        const newNode = htmlStringToDom(potentialHTML);
        el.appendChild(newNode);

        // Record the insertion
        if (historyManager) {
          historyManager.push(
            new DOMChange({
              element: newNode,
              oldParent: null,
              oldNextSibling: null,
              newParent: el,
              newNextSibling: null,
            })
          );
        }
      });

      // End batch if multiple elements
      if (selected.length > 1 && historyManager) {
        historyManager.endBatch();
      }
    }
  };

  const on_copy_styles = async (e) => {
    e.preventDefault();

    window.copied_styles = selected.map((el) => getStyles(el));

    try {
      const colormode = $("vis-bug").attr("color-mode");

      const styles = window.copied_styles[0]
        .map(({ prop, value }) => {
          if (
            prop.includes("color") ||
            prop.includes("background-color") ||
            prop.includes("border-color") ||
            prop.includes("Color") ||
            prop.includes("fill") ||
            prop.includes("stroke")
          )
            value = preferredNotation(value, colormode);

          if (prop.includes("boxShadow")) {
            const [, color, x, y, blur, spread] = getShadowValues(value);
            value = `${preferredNotation(
              color,
              colormode
            )} ${x} ${y} ${blur} ${spread}`;
          }

          if (prop.includes("textShadow")) {
            const [, color, x, y, blur] = getTextShadowValues(value);
            value = `${preferredNotation(color, colormode)} ${x} ${y} ${blur}`;
          }
          return { prop, value };
        })
        .reduce(
          (message, item) => [
            ...message,
            `${camelToDash(item.prop)}: ${item.value};`,
          ],
          []
        )
        .join("\n");

      const { state } = await navigator.permissions.query({
        name: "clipboard-write",
      });

      if (styles && state === "granted") {
        await navigator.clipboard.writeText(styles);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const on_paste_styles = async (e, index = 0) => {
    if (window.copied_styles) {
      // Begin batch if multiple elements or multiple styles
      if (
        (selected.length > 1 || window.copied_styles[index].length > 1) &&
        historyManager
      ) {
        historyManager.beginBatch();
      }

      selected.forEach((el) => {
        window.copied_styles[index].forEach(({ prop, value }) => {
          const oldValue = el.style[prop];

          // Record style change
          if (historyManager) {
            historyManager.push(
              new StyleChange({
                element: el,
                property: prop,
                oldValue: oldValue,
                newValue: value,
              })
            );
          }

          el.style[prop] = value;
        });

        index >= window.copied_styles.length - 1 ? (index = 0) : index++;
      });

      // End batch
      if (
        (selected.length > 1 || window.copied_styles[0].length > 1) &&
        historyManager
      ) {
        historyManager.endBatch();
      }
    } else {
      const potentialStyles = await navigator.clipboard.readText();

      if (selected.length && potentialStyles) {
        // Begin batch if multiple elements
        if (selected.length > 1 && historyManager) {
          historyManager.beginBatch();
        }

        selected.forEach((el) => {
          const oldStyle = el.getAttribute("style");

          // Record attribute change
          if (historyManager) {
            historyManager.push(
              new AttributeChange({
                element: el,
                attribute: "style",
                oldValue: oldStyle,
                newValue: potentialStyles,
              })
            );
          }

          el.style = potentialStyles;
        });

        // End batch if multiple elements
        if (selected.length > 1 && historyManager) {
          historyManager.endBatch();
        }
      }
    }
  };

  const on_expand_selection = (e, { key }) => {
    e.preventDefault();

    const [root] = selected;
    if (!root) return;

    const query = combineNodeNameAndClass(root);

    if (isSelectorValid(query))
      expandSelection({
        query,
        all: key.includes("shift"),
      });
  };

  const on_group = (e, { key }) => {
    e.preventDefault();

    if (key.split("+").includes("shift")) {
      let $selected = [...selected];
      unselect_all();
      $selected.reverse().forEach((el) => {
        let l = el.children.length;
        while (el.children.length > 0) {
          var node = el.childNodes[el.children.length - 1];
          if (node.nodeName !== "#text") select(node);
          el.parentNode.prepend(node);
        }
        el.parentNode.removeChild(el);
      });
    } else {
      let div = document.createElement("div");
      selected[0].parentNode.prepend(
        selected.reverse().reduce((div, el) => {
          div.appendChild(el);
          return div;
        }, div)
      );
      unselect_all();
      select(div);
    }
  };

  const on_selection = (e) =>
    !isOffBounds(e.target) &&
    selected.length &&
    selected[0].textContent != e.target.textContent &&
    e.preventDefault();

  const on_keyboard_traversal = (e, { key }) => {
    if (!selected.length) return;

    e.preventDefault();
    e.stopPropagation();

    const targets = selected.reduce((flat_n_unique, node) => {
      const element_to_left = canMoveLeft(node);
      const element_to_right = canMoveRight(node);
      const has_parent_element = findNearestParentElement(node);
      const has_child_elements = findNearestChildElement(node);

      if (key.includes("shift")) {
        if (key.includes("tab") && element_to_left)
          flat_n_unique.add(element_to_left);
        else if (key.includes("enter") && has_parent_element)
          flat_n_unique.add(has_parent_element);
        else flat_n_unique.add(node);
      } else {
        if (key.includes("tab") && element_to_right)
          flat_n_unique.add(element_to_right);
        else if (key.includes("enter") && has_child_elements)
          flat_n_unique.add(has_child_elements);
        else flat_n_unique.add(node);
      }

      return flat_n_unique;
    }, new Set());

    if (targets.size) {
      unselect_all({ silent: true });
      targets.forEach((node) => {
        select(node);
        show_tip(node);
      });
    }
  };

  const show_tip = (el) => {
    const active_tool = visbug.activeTool;
    let tipFactory;

    if (active_tool === "accessibility") {
      removeAllAccessibilityTips();
      tipFactory = showAccessibilityTip;
    } else if (active_tool === "inspector") {
      removeAllMetaTips();
      tipFactory = showMetaTip;
    }

    if (!tipFactory) return;

    const { top, left } = el.getBoundingClientRect();
    const { pageYOffset, pageXOffset } = window;

    tipFactory(el, {
      clientY: top,
      clientX: left,
      pageY: pageYOffset + top - 10,
      pageX: pageXOffset + left + 20,
    });
  };

  const on_hover = (e) => {
    const $target = deepElementFromPoint(e.clientX, e.clientY);
    const tool = visbug.activeTool;

    if (
      isOffBounds($target) ||
      $target.hasAttribute("data-selected") ||
      $target.hasAttribute("draggable")
    ) {
      clearMeasurements();
      return clearHover();
    }

    overlayHoverUI({
      el: $target,
      // no_hover: tool === 'guides',
      no_label:
        tool === "guides" ||
        tool === "accessibility" ||
        tool === "margin" ||
        tool === "padding" ||
        tool === "inspector",
    });

    if (
      tool === "guides" &&
      selected.length >= 1 &&
      !selected.includes($target)
    ) {
      $target.setAttribute("data-measuring", true);
      const [$anchor] = selected;
      createMeasurements({ $anchor, $target });
    } else if (
      tool === "margin" &&
      !hover_state.element.$shadow.querySelector("visbug-boxmodel")
    ) {
      hover_state.element.$shadow.appendChild(
        createMarginVisual(hover_state.target, true)
      );
    } else if (
      tool === "padding" &&
      !hover_state.element.$shadow.querySelector("visbug-boxmodel")
    ) {
      hover_state.element.$shadow.appendChild(
        createPaddingVisual(hover_state.target, true)
      );
    } else if (
      $target.hasAttribute("data-measuring") ||
      selected.includes($target)
    ) {
      clearMeasurements();
    }

    // force promote into top layer
    if (tool === "guides") {
      handles.forEach((handle) => {
        handle.hidePopover && handle.hidePopover();
        handle.showPopover && handle.showPopover();
      });
    }
  };

  const select = (el) => {
    const id = handles.length;
    const tool = visbug.activeTool;

    el.setAttribute("data-selected", true);
    el.setAttribute("data-label-id", id);

    clearHover();

    overlayMetaUI({
      el,
      id,
      no_label:
        tool === "inspector" ||
        tool === "guides" ||
        tool === "margin" ||
        tool === "move" ||
        tool === "accessibility",
    });

    $("visbug-metatip, visbug-ally").forEach((tip) => {
      tip.hidePopover && tip.hidePopover();
      tip.showPopover && tip.showPopover();
    });

    selected.unshift(el);
    tellWatchers();
  };

  const selection = () => selected;

  const unselect_all = ({ silent = false } = {}) => {
    selected.forEach((el) =>
      $(el).attr({
        "data-selected": null,
        "data-selected-hide": null,
        "data-label-id": null,
        "data-pseudo-select": null,
        "data-outward": null,
      })
    );

    $("[data-pseudo-select]").forEach((hover) =>
      hover.removeAttribute("data-pseudo-select")
    );

    Array.from([
      ...$("visbug-handles"),
      ...$("visbug-label"),
      ...$("visbug-hover"),
      ...$("visbug-distance"),
    ]).forEach((el) => el.remove());

    labels = [];
    handles = [];
    selected = [];

    !silent && tellWatchers();
  };

  const delete_all = () => {
    const selected_after_delete = selected.map((el) => {
      if (canMoveRight(el)) return canMoveRight(el);
      else if (canMoveLeft(el)) return canMoveLeft(el);
      else if (el.parentNode) return el.parentNode;
    });

    Array.from([...selected, ...labels, ...handles]).forEach((el) =>
      el.remove()
    );

    labels = [];
    handles = [];
    selected = [];

    selected_after_delete.forEach((el) => select(el));
  };

  const expandSelection = ({ query, all = false }) => {
    if (all) {
      const unselecteds = $(query + ":not([data-selected])");
      unselecteds.forEach(select);
    } else {
      const potentials = $(query);
      if (!potentials) return;

      const [anchor] = selected;
      const root_node_index = potentials.reduce(
        (index, node, i) => (node == anchor ? (index = i) : index),
        null
      );

      if (root_node_index !== null) {
        if (!potentials[root_node_index + 1]) {
          const potential = potentials.filter(
            (el) => !el.attr("data-selected")
          )[0];
          if (potential) select(potential);
        } else {
          select(potentials[root_node_index + 1]);
        }
      }
    }
  };

  const combineNodeNameAndClass = (node) =>
    `${node.nodeName.toLowerCase()}${createClassname(node)}`;

  const overlayHoverUI = ({ el, no_hover = false, no_label = true }) => {
    if (hover_state.target === el) return;
    hover_state.target = el;

    hover_state.element = no_hover ? null : createHover(el);

    hover_state.label = no_label
      ? null
      : createHoverLabel(el, handleLabelText(el, visbug.activeTool));
  };

  const clearHover = () => {
    if (!hover_state.target) return;

    hover_state.element && hover_state.element.remove();
    hover_state.label && hover_state.label.remove();

    hover_state.target = null;
    hover_state.element = null;
    hover_state.label = null;
  };

  const overlayMetaUI = ({ el, id, no_label = true }) => {
    let handle = createHandle({ el, id });
    let label = no_label
      ? null
      : createLabel({
          el,
          id,
          template: handleLabelText(el, visbug.activeTool),
        });

    let observer = createObserver(el, { handle, label });
    let parentObserver = createObserver(el, { handle, label });

    observer.observe(el, { attributes: true });
    parentObserver.observe(el.parentNode, { childList: true, subtree: true });

    if (label !== null) {
      onRemove(label, () => {
        observer.disconnect();
        parentObserver.disconnect();
      });
    }
  };

  const setLabel = (el, label) => {
    label.text = handleLabelText(el, visbug.activeTool);
    label.update = {
      boundingRect: el.getBoundingClientRect(),
      isFixed: isFixed(el),
    };

    handles.forEach((handle) => {
      handle.hidePopover && handle.hidePopover();
      handle.showPopover && handle.showPopover();
    });
  };

  const createLabel = ({ el, id, template }) => {
    if (!labels[id]) {
      const label = document.createElement("visbug-label");

      label.text = template;
      label.position = {
        boundingRect: el.getBoundingClientRect(),
        node_label_id: id,
        isFixed: isFixed(el),
      };

      document.body.appendChild(label);

      $(label).on("query", ({ detail }) => {
        if (!detail.text) return;

        queryPage("[data-pseudo-select]", (el) =>
          el.removeAttribute("data-pseudo-select")
        );

        queryPage(detail.text + ":not([data-selected])", (el) =>
          detail.activator === "mouseenter"
            ? el.setAttribute("data-pseudo-select", true)
            : select(el)
        );
      });

      $(label).on("mouseleave", (e) => {
        e.preventDefault();
        e.stopPropagation();
        queryPage("[data-pseudo-select]", (el) =>
          el.removeAttribute("data-pseudo-select")
        );
      });

      labels[labels.length] = label;

      handles.forEach((handle) => {
        handle.hidePopover && handle.hidePopover();
        handle.showPopover && handle.showPopover();
      });

      return label;
    }
  };

  const createHandle = ({ el, id }) => {
    if (!handles[id]) {
      const handle = document.createElement("visbug-handles");

      handle.position = { el, node_label_id: id };
      
      // Store historyManager for resize operations
      if (historyManager) {
        handle.historyManager = historyManager;
      }

      document.body.appendChild(handle);

      handles[handles.length] = handle;
      return handle;
    }
  };

  const createHover = (el) => {
    if (
      !el.hasAttribute("data-pseudo-select") &&
      !el.hasAttribute("data-label-id")
    ) {
      if (hover_state.element) hover_state.element.remove();

      hover_state.element = document.createElement("visbug-hover");
      document.body.appendChild(hover_state.element);
      hover_state.element.position = { el };

      return hover_state.element;
    }
  };

  const createHoverLabel = (el, text) => {
    if (
      !el.hasAttribute("data-pseudo-select") &&
      !el.hasAttribute("data-label-id")
    ) {
      if (hover_state.label) hover_state.label.remove();

      hover_state.label = document.createElement("visbug-label");
      document.body.appendChild(hover_state.label);

      hover_state.label.text = text;
      hover_state.label.position = {
        boundingRect: el.getBoundingClientRect(),
        node_label_id: "hover",
      };

      hover_state.label.style.setProperty(`--label-bg`, `hsl(267, 100%, 58%)`);

      return hover_state.label;
    }
  };

  const createCorners = (el) => {
    if (
      !el.hasAttribute("data-pseudo-select") &&
      !el.hasAttribute("data-label-id")
    ) {
      if (hover_state.element) hover_state.element.remove();

      hover_state.element = document.createElement("visbug-corners");
      document.body.appendChild(hover_state.element);
      hover_state.element.position = { el };

      return hover_state.element;
    }
  };

  const setHandle = (el, handle) => {
    handle.position = {
      el,
      node_label_id: el.getAttribute("data-label-id"),
    };
  };

  const createObserver = (node, { label, handle }) =>
    new MutationObserver((list) => {
      label && setLabel(node, label);
      handle && setHandle(node, handle);
    });

  const onSelectedUpdate = (cb, immediateCallback = true) => {
    selectedCallbacks.push(cb);
    if (immediateCallback) cb(selected);
  };

  const removeSelectedCallback = (cb) =>
    (selectedCallbacks = selectedCallbacks.filter(
      (callback) => callback != cb
    ));

  const tellWatchers = () => selectedCallbacks.forEach((cb) => cb(selected));

  const disconnect = () => {
    unselect_all();
    unlisten();
  };

  const on_select_children = (e, { key }) => {
    const targets = selected
      .filter((node) => node.children.length)
      .reduce((flat, { children }) => [...flat, ...Array.from(children)], []);

    if (targets.length) {
      e.preventDefault();
      e.stopPropagation();

      unselect_all();
      targets.forEach((node) => select(node));
    }
  };

  const on_select_parent = (e, { key }) => {
    const targets = selected.reduce((parents, node) => {
      const parent_element = node.parentElement;

      if (parent_element.hasAttribute("data-outward")) return parents;

      parent_element.setAttribute("data-outward", true);
      parents.push(parent_element);

      return parents;
    }, []);

    if (targets.length) {
      e.preventDefault();
      e.stopPropagation();

      targets.forEach((node) => {
        if (node && node !== document.body) {
          select(node);
        }
      });
    }
  };

  watchImagesForUpload();
  listen();

  return {
    select,
    selection,
    unselect_all,
    onSelectedUpdate,
    removeSelectedCallback,
    disconnect,
    historyManager,
  };
}

export const handleLabelText = (el, activeTool) => {
  switch(activeTool) {
    case 'align':
      return getStyle(el, 'display')

    default:
      return `
        <a node>${el.nodeName.toLowerCase()}</a>
        <a>${el.id && '#' + el.id}</a>
        ${createClassname(el).split('.')
          .filter(name => name != '')
          .reduce((links, name) => `
            ${links}
            <a>.${name}</a>
          `, '')
        }
      `
  }
}
