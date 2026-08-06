import hotkeys from 'hotkeys-js'
import { metaKey, getStyle, showHideSelected } from '../utilities/'
import { StyleChange } from "./history";

const key_events = "up,down,left,right"
  .split(",")
  .reduce(
    (events, event) =>
      `${events},${event},shift+${event},alt+${event},alt+shift+${event}`,
    ""
  )
  .substring(1);

const command_events = `${metaKey}+up,${metaKey}+shift+up,${metaKey}+down,${metaKey}+shift+down,${metaKey}+left,${metaKey}+shift+left,${metaKey}+right,${metaKey}+shift+right`;

export function BoxShadow({ selection, historyManager }) {
  hotkeys(key_events, (e, handler) => {
    if (e.cancelBubble) return;

    e.preventDefault();

    let selectedNodes = selection(),
      keys = handler.key.split("+");

    if (keys.includes("left") || keys.includes("right"))
      keys.includes("alt")
        ? changeBoxShadow(selectedNodes, keys, "size", historyManager)
        : changeBoxShadow(selectedNodes, keys, "x", historyManager);
    else
      keys.includes("alt")
        ? changeBoxShadow(selectedNodes, keys, "blur", historyManager)
        : changeBoxShadow(selectedNodes, keys, "y", historyManager);
  });

  hotkeys(command_events, (e, handler) => {
    e.preventDefault();
    let keys = handler.key.split("+");
    keys.includes("left") || keys.includes("right")
      ? changeBoxShadow(selection(), keys, "opacity", historyManager)
      : changeBoxShadow(selection(), keys, "inset", historyManager);
  });

  return () => {
    hotkeys.unbind(key_events);
    hotkeys.unbind(command_events);
    hotkeys.unbind("up,down,left,right");
  };
}

const ensureHasShadow = (el) => {
  if (el.style.boxShadow == "" || el.style.boxShadow == "none")
    el.style.boxShadow = "hsla(0,0%,0%,30%) 0 0 0 0";
  return el;
};

// todo: work around this propMap with a better split
const propMap = {
  opacity: 3,
  x: 4,
  y: 5,
  blur: 6,
  size: 7,
  inset: 8,
};

const parseCurrentShadow = (el) => getStyle(el, "boxShadow").split(" ");

export function changeBoxShadow(els, direction, prop, historyManager) {
  // Begin batch if multiple elements
  if (els.length > 1 && historyManager) {
    historyManager.beginBatch();
  }

  els
    .map(ensureHasShadow)
    .map((el) => showHideSelected(el, 1500))
    .map((el) => ({
      el,
      style: "boxShadow",
      current: parseCurrentShadow(el), // ["rgb(255,", "0,", "0)", "0px", "0px", "1px", "0px"]
      propIndex: parseCurrentShadow(el)[0].includes("rgba")
        ? propMap[prop]
        : propMap[prop] - 1,
    }))
    .map((payload) => {
      let updated = [...payload.current];
      let cur =
        prop === "opacity"
          ? payload.current[payload.propIndex]
          : parseInt(payload.current[payload.propIndex]);

      switch (prop) {
        case "blur":
        case "size":
          var amount = direction.includes("shift") ? 10 : 1;
          updated[payload.propIndex] =
            direction.includes("down") || direction.includes("left")
              ? `${cur - amount}px`
              : `${cur + amount}px`;
          break;
        case "inset":
          updated[payload.propIndex] = direction.includes("down")
            ? "inset"
            : "";
          break;
        case "opacity":
          let cur_opacity = parseFloat(cur.slice(0, cur.indexOf(")")));
          var amount = direction.includes("shift") ? 0.1 : 0.01;
          updated[payload.propIndex] = direction.includes("left")
            ? cur_opacity - amount + ")"
            : cur_opacity + amount + ")";
          break;
        default:
          var amount = direction.includes("shift") ? 10 : 1;
          updated[payload.propIndex] =
            direction.includes("left") || direction.includes("up")
              ? `${cur - amount}px`
              : `${cur + amount}px`;
          break;
      }

      payload.value = updated;
      return payload;
    })
    .forEach(({ el, style, value, current }) => {
      const oldValue = current.join(" ");
      const newValue = value.join(" ");

      // Record change in history
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
