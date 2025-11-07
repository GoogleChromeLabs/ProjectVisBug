import hotkeys from 'hotkeys-js'
import { metaKey, getStyle, showHideSelected } from '../utilities/'
import { StyleChange } from "./history";

const key_events = "up,down,left,right"
  .split(",")
  .reduce((events, event) => `${events},${event},shift+${event}`, "")
  .substring(1);

const command_events = `${metaKey}+up,${metaKey}+down`;

export function Font({ selection, historyManager }) {
  hotkeys(key_events, (e, handler) => {
    if (e.cancelBubble) return;

    e.preventDefault();

    let selectedNodes = selection(),
      keys = handler.key.split("+");

    if (keys.includes("left") || keys.includes("right"))
      keys.includes("shift")
        ? changeKerning(selectedNodes, handler.key, historyManager)
        : changeAlignment(selectedNodes, handler.key, historyManager);
    else
      keys.includes("shift")
        ? changeLeading(selectedNodes, handler.key, historyManager)
        : changeFontSize(selectedNodes, handler.key, historyManager);
  });

  hotkeys(command_events, (e, handler) => {
    e.preventDefault();
    let keys = handler.key.split("+");
    changeFontWeight(
      selection(),
      keys.includes("up") ? "up" : "down",
      historyManager
    );
  });

  hotkeys("cmd+b", (e) => {
    const nodes = selection();
    if (nodes.length > 1 && historyManager) {
      historyManager.beginBatch();
    }

    nodes.forEach((el) => {
      const oldValue = el.style.fontWeight;

      if (historyManager) {
        historyManager.push(
          new StyleChange({
            element: el,
            property: "fontWeight",
            oldValue: oldValue,
            newValue: el.style.fontWeight == "bold" ? "" : "bold",
          })
        );
      }

      el.style.fontWeight = el.style.fontWeight == "bold" ? null : "bold";
    });

    if (nodes.length > 1 && historyManager) {
      historyManager.endBatch();
    }
  });

  hotkeys("cmd+i", (e) => {
    const nodes = selection();
    if (nodes.length > 1 && historyManager) {
      historyManager.beginBatch();
    }

    nodes.forEach((el) => {
      const oldValue = el.style.fontStyle;

      if (historyManager) {
        historyManager.push(
          new StyleChange({
            element: el,
            property: "fontStyle",
            oldValue: oldValue,
            newValue: el.style.fontStyle == "italic" ? "" : "italic",
          })
        );
      }

      el.style.fontStyle = el.style.fontStyle == "italic" ? null : "italic";
    });

    if (nodes.length > 1 && historyManager) {
      historyManager.endBatch();
    }
  });

  return () => {
    hotkeys.unbind(key_events);
    hotkeys.unbind(command_events);
    hotkeys.unbind("cmd+b,cmd+i");
    hotkeys.unbind("up,down,left,right");
  };
}

export function changeLeading(els, direction, historyManager) {
  // Begin batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.beginBatch();
  }

  els
    .map((el) => showHideSelected(el))
    .map((el) => ({
      el,
      style: "lineHeight",
      current: parseInt(getStyle(el, "lineHeight")),
      amount: 1,
      negative: direction.split("+").includes("down"),
    }))
    .map((payload) =>
      Object.assign(payload, {
        current:
          payload.current == "normal" || isNaN(payload.current)
            ? 1.14 * parseInt(getStyle(payload.el, "fontSize")) // document this choice
            : payload.current,
      })
    )
    .map((payload) =>
      Object.assign(payload, {
        value: payload.negative
          ? payload.current - payload.amount
          : payload.current + payload.amount,
      })
    )
    .forEach(({ el, style, value, current }) => {
      const oldValue = `${current}px`;
      const newValue = `${value}px`;

      // Record change
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
    });

  // End batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.endBatch();
  }
}

export function changeKerning(els, direction, historyManager) {
  // Begin batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.beginBatch();
  }

  els
    .map((el) => showHideSelected(el))
    .map((el) => ({
      el,
      style: "letterSpacing",
      current: parseFloat(getStyle(el, "letterSpacing")),
      amount: 0.1,
      negative: direction.split("+").includes("left"),
    }))
    .map((payload) =>
      Object.assign(payload, {
        current:
          payload.current == "normal" || isNaN(payload.current)
            ? 0
            : payload.current,
      })
    )
    .map((payload) =>
      Object.assign(payload, {
        value: payload.negative
          ? (payload.current - payload.amount).toFixed(2)
          : (payload.current + payload.amount).toFixed(2),
      })
    )
    .forEach(({ el, style, value, current }) => {
      const finalValue = value <= -2 ? -2 : value;
      const oldValue = `${current}px`;
      const newValue = `${finalValue}px`;

      // Record change
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
    });

  // End batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.endBatch();
  }
}

export function changeFontSize(els, direction, historyManager) {
  // Begin batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.beginBatch();
  }

  els
    .map((el) => showHideSelected(el))
    .map((el) => ({
      el,
      style: "fontSize",
      current: parseInt(getStyle(el, "fontSize")),
      amount: direction.split("+").includes("shift") ? 10 : 1,
      negative: direction.split("+").includes("down"),
    }))
    .map((payload) =>
      Object.assign(payload, {
        font_size: payload.negative
          ? payload.current - payload.amount
          : payload.current + payload.amount,
      })
    )
    .forEach(({ el, style, font_size, current }) => {
      const finalSize = font_size <= 6 ? 6 : font_size;
      const oldValue = `${current}px`;
      const newValue = `${finalSize}px`;

      // Record change
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
    });

  // End batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.endBatch();
  }
}

const weightMap = {
  normal: 2,
  bold: 5,
  light: 0,
  "": 2,
  100: 0,
  200: 1,
  300: 2,
  400: 3,
  500: 4,
  600: 5,
  700: 6,
  800: 7,
  900: 8,
  1000: 9,
};
const weightOptions = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

export function changeFontWeight(els, direction, historyManager) {
  // Begin batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.beginBatch();
  }

  els
    .map((el) => showHideSelected(el))
    .map((el) => ({
      el,
      style: "fontWeight",
      current: getStyle(el, "fontWeight"),
      direction: direction.split("+").includes("down"),
    }))
    .map((payload) =>
      Object.assign(payload, {
        value: payload.direction
          ? weightMap[payload.current] - 1
          : weightMap[payload.current] + 1,
      })
    )
    .forEach(({ el, style, value, current }) => {
      const finalValue =
        weightOptions[
          value < 0
            ? 0
            : value >= weightOptions.length
            ? weightOptions.length
            : value
        ];
      const oldValue = current;
      const newValue = String(finalValue);

      // Record change
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

      el.style[style] = finalValue;
    });

  // End batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.endBatch();
  }
}

const alignMap = {
  start: 0,
  left: 0,
  center: 1,
  right: 2,
};
const alignOptions = ["left", "center", "right"];

export function changeAlignment(els, direction, historyManager) {
  // Begin batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.beginBatch();
  }

  els
    .map((el) => showHideSelected(el))
    .map((el) => ({
      el,
      style: "textAlign",
      current: getStyle(el, "textAlign"),
      direction: direction.split("+").includes("left"),
    }))
    .map((payload) =>
      Object.assign(payload, {
        value: payload.direction
          ? alignMap[payload.current] - 1
          : alignMap[payload.current] + 1,
      })
    )
    .forEach(({ el, style, value, current }) => {
      const finalValue = alignOptions[value < 0 ? 0 : value >= 2 ? 2 : value];
      const oldValue = current;
      const newValue = finalValue;

      // Record change
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
    });

  // End batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.endBatch();
  }
}
