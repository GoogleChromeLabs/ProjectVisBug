import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { metaKey, getStyle, getSide, showHideSelected } from '../utilities/'
import { StyleChange, AttributeChange } from "./history";

const key_events = "up,down,left,right"
  .split(",")
  .reduce(
    (events, event) =>
      `${events},${event},alt+${event},shift+${event},shift+alt+${event}`,
    ""
  )
  .substring(1);

const command_events = `${metaKey}+up,${metaKey}+shift+up,${metaKey}+down,${metaKey}+shift+down`;

export function Position(historyManager) {
  const state = {
    elements: [],
    historyManager: historyManager,
  };

  hotkeys(key_events, (e, handler) => {
    if (e.cancelBubble) return;

    e.preventDefault();
    positionElement(state.elements, handler.key, historyManager);
  });

  const onNodesSelected = (els) => {
    state.elements.forEach((el) => el.teardown());

    state.elements = els.map((el) => draggable({ el, historyManager }));
  };

  const disconnect = () => {
    state.elements.forEach((el) => el.teardown());
    hotkeys.unbind(key_events);
    hotkeys.unbind("up,down,left,right");
  };

  return {
    onNodesSelected,
    disconnect,
  };
}

export function draggable({
  el,
  surface = el,
  cursor = "move",
  clickEvent,
  historyManager,
}) {
  const state = {
    target: el,
    surface,
    mouse: {
      down: false,
      x: 0,
      y: 0,
    },
    element: {
      x: 0,
      y: 0,
    },
    travelDistance: 0,
    historyManager: historyManager,
    // Store initial values for history tracking
    initialPosition: null,
    initialTransform: null,
    zIndex: null,
  };

  const setup = () => {
    el.style.transition = "none";
    surface.style.cursor = cursor;

    surface.addEventListener("mousedown", onMouseDown, true);
    surface.addEventListener("mouseup", onMouseUp, true);
    document.addEventListener("mousemove", onMouseMove, true);
  };

  const teardown = () => {
    el.style.transition = null;
    surface.style.cursor = null;

    surface.removeEventListener("mousedown", onMouseDown, true);
    surface.removeEventListener("mouseup", onMouseUp, true);
    document.removeEventListener("mousemove", onMouseMove, true);
  };

  const onMouseDown = (e) => {
    if (e.target !== state.surface) return;
    e.preventDefault();

    // TODO: There has to be a better way to tackle this
    if (state.zIndex == null) {
      state.zIndex = el.style.zIndex;
      el.style.zIndex = 9999999999999;
    }

    if (getComputedStyle(el).position == "static")
      el.style.position = "relative";
    el.style.willChange = "top,left";

    if (el instanceof SVGElement) {
      const translate = el.getAttribute("transform");

      const [x, y] = translate ? extractSVGTranslate(translate) : [0, 0];

      state.element.x = x;
      state.element.y = y;

      // Store initial transform for history
      if (state.historyManager) {
        state.initialTransform = translate || null;
      }
    } else {
      state.element.x = parseInt(getStyle(el, "left"));
      state.element.y = parseInt(getStyle(el, "top"));

      // Store initial position for history
      if (state.historyManager) {
        state.initialPosition = {
          left: el.style.left,
          top: el.style.top,
        };
      }
    }

    state.mouse.x = e.clientX;
    state.mouse.y = e.clientY;
    state.mouse.down = true;
    state.travelDistance = 0;
  };

  const onMouseUp = (e) => {
    if (e.target !== state.surface) return;

    e.preventDefault();
    e.stopPropagation();

    if (state.zIndex != null) {
      el.style.zIndex = state.zIndex;
      state.zIndex = null;
    }

    state.mouse.down = false;
    el.style.willChange = null;

    if (el instanceof SVGElement) {
      const translate = el.getAttribute("transform");

      const [x, y] = translate ? extractSVGTranslate(translate) : [0, 0];

      // Record SVG transform change
      if (state.historyManager && state.initialTransform !== translate) {
        state.historyManager.push(
          new AttributeChange({
            element: el,
            attribute: "transform",
            oldValue: state.initialTransform,
            newValue: translate,
          })
        );
        state.initialTransform = null;
      }

      state.element.x = x;
      state.element.y = y;
    } else {
      state.element.x = parseInt(el.style.left) || 0;
      state.element.y = parseInt(el.style.top) || 0;

      // Record position changes (if element was actually moved)
      if (state.historyManager && state.initialPosition) {
        const currentLeft = el.style.left;
        const currentTop = el.style.top;

        // Record changes as a batch if both left and top changed
        const leftChanged = state.initialPosition.left !== currentLeft;
        const topChanged = state.initialPosition.top !== currentTop;

        if (leftChanged || topChanged) {
          if (leftChanged && topChanged) {
            state.historyManager.beginBatch();
          }

          if (leftChanged) {
            state.historyManager.push(
              new StyleChange({
                element: el,
                property: "left",
                oldValue: state.initialPosition.left,
                newValue: currentLeft,
              })
            );
          }

          if (topChanged) {
            state.historyManager.push(
              new StyleChange({
                element: el,
                property: "top",
                oldValue: state.initialPosition.top,
                newValue: currentTop,
              })
            );
          }

          if (leftChanged && topChanged) {
            state.historyManager.endBatch();
          }
        }

        state.initialPosition = null;
      }
    }

    const treatAsClick = !state.travelDistance || state.travelDistance < 5;
    if (clickEvent && treatAsClick) clickEvent(e);
    state.travelDistance = 0; // reset after
  };

  const onMouseMove = (e) => {
    if (!state.mouse.down) return;

    e.preventDefault();
    e.stopPropagation();

    if (el instanceof SVGElement) {
      el.setAttribute(
        "transform",
        `translate(
        ${state.element.x + e.clientX - state.mouse.x},
        ${state.element.y + e.clientY - state.mouse.y}
      )`
      );
    } else {
      el.style.left = state.element.x + e.clientX - state.mouse.x + "px";
      el.style.top = state.element.y + e.clientY - state.mouse.y + "px";
    }

    state.travelDistance += 1;
  };

  setup();
  el.teardown = teardown;

  return el;
}

export function positionElement(els, direction, historyManager) {
  // Begin batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.beginBatch();
  }

  els
    .map((el) => ensurePositionable(el))
    .map((el) => showHideSelected(el))
    .map((el) => ({
      el,
      ...extractCurrentValueAndSide(el, direction),
      amount: direction.split("+").includes("shift") ? 10 : 1,
      negative: determineNegativity(el, direction),
    }))
    .map((payload) =>
      Object.assign(payload, {
        position: payload.negative
          ? payload.current + payload.amount
          : payload.current - payload.amount,
      })
    )
    .forEach(({ el, style, position, current }) => {
      if (el instanceof SVGElement) {
        const oldTransform = el.getAttribute("transform");
        setTranslateOnSVG(el, direction, position);
        const newTransform = el.getAttribute("transform");

        // Record SVG attribute change
        if (historyManager) {
          historyManager.push(
            new AttributeChange({
              element: el,
              attribute: "transform",
              oldValue: oldTransform,
              newValue: newTransform,
            })
          );
        }
      } else {
        const oldValue = el.style[style];
        const newValue = position + "px";

        // Record style change
        if (historyManager) {
          historyManager.push(
            new StyleChange({
              element: el,
              property: style,
              oldValue: oldValue,
              newValue: newValue,
            })
          );
        }

        el.style[style] = newValue;
      }
    });

  // End batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.endBatch();
  }
}

const extractCurrentValueAndSide = (el, direction) => {
  let style, current

  if (el instanceof SVGElement) {
    const translate = el.attr('transform')

    const [ x, y ] = translate
      ? extractSVGTranslate(translate)
      : [0,0]

    style   = 'transform'
    current = direction.includes('down') || direction.includes('up')
      ? y
      : x
  }
  else {
    const side = getSide(direction).toLowerCase()
    style = (side === 'top' || side === 'bottom') ? 'top' : 'left'
    current = getStyle(el, style)

    current === 'auto'
      ? current = 0
      : current = parseInt(current, 10)
  }

  return { style, current }
}

const extractSVGTranslate = translate =>
  translate.substring(
    translate.indexOf('(') + 1,
    translate.indexOf(')')
  ).split(',')
  .map(val => parseFloat(val))

const setTranslateOnSVG = (el, direction, position) => {
  const transform = el.attr('transform')
  const [ x, y ] = transform
    ? extractSVGTranslate(transform)
    : [0,0]

  const pos = direction.includes('down') || direction.includes('up')
    ? `${x},${position}`
    : `${position},${y}`

  el.attr('transform', `translate(${pos})`)
}

const determineNegativity = (el, direction) =>
  direction.includes('right') || direction.includes('down')

const ensurePositionable = el => {
  if (el instanceof HTMLElement)
    el.style.position = 'relative'
  return el
}
