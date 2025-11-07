import hotkeys from 'hotkeys-js'
import { metaKey, getStyle } from '../utilities/'
import { StyleChange } from "./history";

const key_events = "up,down,left,right"
  .split(",")
  .reduce((events, event) => `${events},${event},shift+${event}`, "")
  .substring(1);

const command_events = `${metaKey}+up,${metaKey}+down,${metaKey}+left,${metaKey}+right,${metaKey}+shift+up,${metaKey}+shift+down,${metaKey}+shift+left,${metaKey}+shift+right`;

export function Flex({ selection, historyManager }) {
  hotkeys(key_events, (e, handler) => {
    if (e.cancelBubble) return;

    e.preventDefault();

    let selectedNodes = selection(),
      keys = handler.key.split("+");

    if (keys.includes("left") || keys.includes("right"))
      keys.includes("shift")
        ? changeHDistribution(selectedNodes, handler.key, historyManager)
        : changeHAlignment(selectedNodes, handler.key, historyManager);
    else
      keys.includes("shift")
        ? changeVDistribution(selectedNodes, handler.key, historyManager)
        : changeVAlignment(selectedNodes, handler.key, historyManager);
  });

  hotkeys(command_events, (e, handler) => {
    e.preventDefault();

    let selectedNodes = selection(),
      keys = handler.key.split("+");

    if (keys.includes("left") || keys.includes("right"))
      keys.includes("shift")
        ? changeOrder(selectedNodes, handler.key, historyManager)
        : changeDirection(selectedNodes, "row", historyManager);
    else
      keys.includes("shift")
        ? changeWrap(selectedNodes, handler.key, historyManager)
        : changeDirection(selectedNodes, "column", historyManager);
  });

  return () => {
    hotkeys.unbind(key_events);
    hotkeys.unbind(command_events);
    hotkeys.unbind("up,down,left,right");
  };
}

const ensureFlex = (el) => {
  el.style.display = "flex";
  return el;
};

const accountForOtherJustifyContent = (cur, want) => {
  if (
    want == "align" &&
    cur != "flex-start" &&
    cur != "center" &&
    cur != "flex-end"
  )
    cur = "normal";
  else if (
    want == "distribute" &&
    cur != "space-around" &&
    cur != "space-between"
  )
    cur = "normal";

  return cur;
};

// todo: support reversing direction
export function changeDirection(els, value, historyManager) {
  // Begin batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.beginBatch();
  }

  els.map(ensureFlex).forEach((el) => {
    const oldValue = el.style.flexDirection;

    // Record change
    if (historyManager) {
      historyManager.push(
        new StyleChange({
          element: el,
          property: "flexDirection",
          oldValue: oldValue,
          newValue: value,
        })
      );
    }

    el.style.flexDirection = value;
  });

  // End batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.endBatch();
  }
}

const h_alignMap = { normal: 0, "flex-start": 0, center: 1, "flex-end": 2 };
const h_alignOptions = ["flex-start", "center", "flex-end"];

export function changeHAlignment(els, direction, historyManager) {
  // Begin batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.beginBatch();
  }

  els
    .map(ensureFlex)
    .map((el) => ({
      el,
      style: "justifyContent",
      current: accountForOtherJustifyContent(
        getStyle(el, "justifyContent"),
        "align"
      ),
      direction: direction.split("+").includes("left"),
    }))
    .map((payload) =>
      Object.assign(payload, {
        value: payload.direction
          ? h_alignMap[payload.current] - 1
          : h_alignMap[payload.current] + 1,
      })
    )
    .forEach(({ el, style, value, current }) => {
      const newValue = h_alignOptions[value < 0 ? 0 : value >= 2 ? 2 : value];
      const oldValue = current;

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

const v_alignMap = { normal: 0, "flex-start": 0, center: 1, "flex-end": 2 };
const v_alignOptions = ["flex-start", "center", "flex-end"];

export function changeVAlignment(els, direction, historyManager) {
  // Begin batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.beginBatch();
  }

  els
    .map(ensureFlex)
    .map((el) => ({
      el,
      style: "alignItems",
      current: getStyle(el, "alignItems"),
      direction: direction.split("+").includes("up"),
    }))
    .map((payload) =>
      Object.assign(payload, {
        value: payload.direction
          ? h_alignMap[payload.current] - 1
          : h_alignMap[payload.current] + 1,
      })
    )
    .forEach(({ el, style, value, current }) => {
      const newValue = v_alignOptions[value < 0 ? 0 : value >= 2 ? 2 : value];
      const oldValue = current;

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

const h_distributionMap = {
  normal: 1,
  "space-around": 0,
  "": 1,
  "space-between": 2,
};
const h_distributionOptions = ["space-around", "", "space-between"];

export function changeHDistribution(els, direction, historyManager) {
  // Begin batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.beginBatch();
  }

  els
    .map(ensureFlex)
    .map((el) => ({
      el,
      style: "justifyContent",
      current: accountForOtherJustifyContent(
        getStyle(el, "justifyContent"),
        "distribute"
      ),
      direction: direction.split("+").includes("left"),
    }))
    .map((payload) =>
      Object.assign(payload, {
        value: payload.direction
          ? h_distributionMap[payload.current] - 1
          : h_distributionMap[payload.current] + 1,
      })
    )
    .forEach(({ el, style, value, current }) => {
      const newValue =
        h_distributionOptions[value < 0 ? 0 : value >= 2 ? 2 : value];
      const oldValue = current;

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

const v_distributionMap = {
  normal: 1,
  "space-around": 0,
  "": 1,
  "space-between": 2,
};
const v_distributionOptions = ["space-around", "", "space-between"];

export function changeVDistribution(els, direction, historyManager) {
  // Begin batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.beginBatch();
  }

  els
    .map(ensureFlex)
    .map((el) => ({
      el,
      style: "alignContent",
      current: getStyle(el, "alignContent"),
      direction: direction.split("+").includes("up"),
    }))
    .map((payload) =>
      Object.assign(payload, {
        value: payload.direction
          ? v_distributionMap[payload.current] - 1
          : v_distributionMap[payload.current] + 1,
      })
    )
    .forEach(({ el, style, value, current }) => {
      const newValue =
        v_distributionOptions[value < 0 ? 0 : value >= 2 ? 2 : value];
      const oldValue = current;

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

const orderMap = { row: 0, "row-reverse": 1, column: 2, "column-reverse": 3 };
const orderOptions = ["row", "row-reverse", "column", "column-reverse"];

export function changeOrder(els, direction, historyManager) {
  // Begin batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.beginBatch();
  }

  els
    .map(ensureFlex)
    .map((el) => ({
      el,
      style: "flexDirection",
      current: getStyle(el, "flexDirection"),
      direction: direction.split("+").includes("left"),
    }))
    .map((payload) =>
      Object.assign(payload, {
        value: payload.direction
          ? orderMap[payload.current] === 1 || orderMap[payload.current] === 3
            ? orderMap[payload.current]
            : orderMap[payload.current] + 1
          : orderMap[payload.current] === 0 || orderMap[payload.current] === 2
          ? orderMap[payload.current]
          : orderMap[payload.current] - 1,
      })
    )
    .forEach(({ el, style, value, current }) => {
      const newValue = orderOptions[value];
      const oldValue = current;

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

const wrapMap = { nowrap: 0, wrap: 1 };
const wrapOptions = ["nowrap", "wrap"];

export function changeWrap(els, direction, historyManager) {
  // Begin batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.beginBatch();
  }

  els
    .map(ensureFlex)
    .map((el) => ({
      el,
      style: "flexWrap",
      current: getStyle(el, "flexWrap"),
      direction: direction.split("+").includes("up"),
    }))
    .map((payload) =>
      Object.assign(payload, {
        value: payload.direction
          ? wrapMap[payload.current] === 0
            ? wrapMap[payload.current]
            : wrapMap[payload.current] - 1
          : wrapMap[payload.current] === 1
          ? wrapMap[payload.current]
          : wrapMap[payload.current] + 1,
      })
    )
    .forEach(({ el, style, value, current }) => {
      const newValue = wrapOptions[value];
      const oldValue = current;

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
