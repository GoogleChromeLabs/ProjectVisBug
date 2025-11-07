import $ from 'blingblingjs'
import hotkeys from 'hotkeys-js'
import { showHideNodeLabel } from '../utilities/'
import { TextChange } from "./history";

const state = {
  historyManager: null,
  originalText: new WeakMap(), // Store original text for each element
};

const removeEditability = ({ target }) => {
  // Record text change if text was modified
  if (state.historyManager && state.originalText.has(target)) {
    const oldText = state.originalText.get(target);
    const newText = target.textContent;

    if (oldText !== newText) {
      state.historyManager.push(
        new TextChange({
          element: target,
          oldText: oldText,
          newText: newText,
        })
      );
    }

    state.originalText.delete(target);
  }

  target.removeAttribute("contenteditable");
  target.removeAttribute("spellcheck");
  target.removeEventListener("blur", removeEditability);
  target.removeEventListener("keydown", stopBubbling);
  hotkeys.unbind("escape,esc");
};

const stopBubbling = (e) => e.key != "Escape" && e.stopPropagation();

const cleanup = (e, handler) => {
  $('[spellcheck="true"]').forEach((target) => removeEditability({ target }));
  window.getSelection().empty();
};

export function EditText(elements, historyManager) {
  if (!elements.length) return;

  state.historyManager = historyManager;

  elements.map((el) => {
    let $el = $(el);

    // Store original text before making it editable
    if (historyManager) {
      state.originalText.set(el, el.textContent);
    }

    $el.attr({
      contenteditable: true,
      spellcheck: true,
    });
    el.focus();
    showHideNodeLabel(el, true);

    $el.on("keydown", stopBubbling);
    $el.on("blur", removeEditability);
  });

  hotkeys("escape,esc", cleanup);
}