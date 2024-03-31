/**
Types: Not all applicable

export type EditEvent = {
  createdAt: string;
  selector: string;
  editType: EditType;
  newVal: Record<string, string> | TextVal;
  oldVal: Record<string, string> | TextVal;
}

export type TextVal = {
  text: string;
}

export enum EditType {
  TEXT = "TEXT",
  STYLE = "STYLE",
  ATTR = "ATTR",
  INSERT = "INSERT",
  REMOVE = "REMOVE",
}
 */

export const EditType = {
  TEXT: "TEXT",
  STYLE: "STYLE",
  ATTR: "ATTR",
  INSERT: "INSERT",
  REMOVE: "REMOVE",
}
export let history = [];
export let redo = [];

export function clearHistory() {
  history = [];
  redo = [];
}

// Check keys to deduplicate events
function compareKeys(a, b) {
  if (!a || !b) return false;
  const set1 = new Set(Object.keys(a));
  const set2 = new Set(Object.keys(b));
  if (set1.size !== set2.size) return false;
  for (let item of set1) {
    if (!set2.has(item)) return false;
  }
  return true;
}


export function addToHistory(event) {
  if (history.length === 0) {
    history.push(event);
    return;
  }

  // Deduplicate last event
  const lastEvent = history[history.length - 1];
  if (
    lastEvent.editType === event.editType &&
    lastEvent.selector === event.selector &&
    compareKeys(lastEvent.newVal, event.newVal)
  ) {
    lastEvent.newVal = event.newVal;
    lastEvent.createdAt = event.createdAt;
    history[history.length - 1] = lastEvent;
  } else {
    history.push(event);
  }
}

export function undoLastEvent() {
  if (history.length === 0) {
    return;
  }
  const lastEvent = history.pop();
  if (lastEvent) {
    const reverseEvent = createReverseEvent(lastEvent);
    applyEvent(reverseEvent);
    redo.push(lastEvent);
  }
}

export function redoLastEvent() {
  const event = redo.pop();
  if (event) {
    applyEvent(event);
    history.push(event);
  }
}

function createReverseEvent(event) {
  switch (event.editType) {
    // Not handling insert and remove types
    case EditType.STYLE || EditType.TEXT:
    default:
      return {
        createdAt: event.createdAt,
        selector: event.selector,
        editType: event.editType,
        newVal: event.oldVal,
        oldVal: event.newVal,
      };
  }
}

function applyStyleEvent(event, element) {
  if (!element) return;
  Object.entries(event.newVal).forEach(([style, newVal]) => {
    element.style[style] = newVal;
  });
}

function applyTextEvent(event, element) {
  if (!element) return;
  const newVal = event.newVal;
  element.textContent = newVal.text;
}


function applyEvent(event) {
  const element = document.querySelector(event.selector);
  switch (event.editType) {
    case EditType.STYLE:
      applyStyleEvent(event, element);
      break;
    case EditType.TEXT:
      applyTextEvent(event, element);
      break;
    default:
      console.error('Unsupported edit type');
      break;
  }
}
