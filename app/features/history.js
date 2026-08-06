// Base Change class
export class Change {
  constructor() {
    this.timestamp = Date.now();
  }

  undo() {
    throw new Error("undo() must be implemented");
  }

  redo() {
    throw new Error("redo() must be implemented");
  }

  canMerge(other) {
    return false;
  }

  merge(other) {
    return this;
  }
}

// Style changes (most common)
export class StyleChange extends Change {
  constructor({ element, property, oldValue, newValue }) {
    super();
    this.element = element;
    this.property = property;
    this.oldValue = oldValue;
    this.newValue = newValue;
  }

  undo() {
    if (this.element && this.element.isConnected) {
      this.element.style[this.property] = this.oldValue;
    }
  }

  redo() {
    if (this.element && this.element.isConnected) {
      this.element.style[this.property] = this.newValue;
    }
  }

  canMerge(other) {
    return (
      other instanceof StyleChange &&
      other.element === this.element &&
      other.property === this.property &&
      other.timestamp - this.timestamp < 1000
    ); // Within 1 second
  }

  merge(other) {
    // Keep the original oldValue but use the new newValue
    return new StyleChange({
      element: this.element,
      property: this.property,
      oldValue: this.oldValue,
      newValue: other.newValue,
    });
  }
}

// Attribute changes
export class AttributeChange extends Change {
  constructor({ element, attribute, oldValue, newValue }) {
    super();
    this.element = element;
    this.attribute = attribute;
    this.oldValue = oldValue;
    this.newValue = newValue;
  }

  undo() {
    if (!this.element?.isConnected) return;

    if (this.oldValue === null) {
      this.element.removeAttribute(this.attribute);
    } else {
      this.element.setAttribute(this.attribute, this.oldValue);
    }
  }

  redo() {
    if (!this.element?.isConnected) return;

    if (this.newValue === null) {
      this.element.removeAttribute(this.attribute);
    } else {
      this.element.setAttribute(this.attribute, this.newValue);
    }
  }
}

// DOM structural changes
export class DOMChange extends Change {
  constructor({
    element,
    oldParent,
    oldNextSibling,
    newParent,
    newNextSibling,
  }) {
    super();
    this.element = element;
    this.oldParent = oldParent;
    this.oldNextSibling = oldNextSibling;
    this.newParent = newParent;
    this.newNextSibling = newNextSibling;
  }

  undo() {
    if (!this.element) return;

    // If we have an oldParent, this was a move or deletion -> restore to old location
    if (this.oldParent) {
      if (this.oldNextSibling && this.oldNextSibling.isConnected) {
        this.oldParent.insertBefore(this.element, this.oldNextSibling);
      } else {
        this.oldParent.appendChild(this.element);
      }
      return;
    }

    // If oldParent is null but newParent exists, this was an insertion -> undo by removing
    if (this.newParent && this.element.isConnected) {
      this.element.remove();
    }
  }

  redo() {
    if (!this.element) return;

    // If newParent exists, re-insert/move element to new location
    if (this.newParent) {
      if (this.newNextSibling && this.newNextSibling.isConnected) {
        this.newParent.insertBefore(this.element, this.newNextSibling);
      } else {
        this.newParent.appendChild(this.element);
      }
      return;
    }

    // If newParent is null, this represents a deletion -> redo by removing element
    if (this.element.isConnected) {
      this.element.remove();
    }
  }
}

// Text content changes
export class TextChange extends Change {
  constructor({ element, oldText, newText }) {
    super();
    this.element = element;
    this.oldText = oldText;
    this.newText = newText;
  }

  undo() {
    if (this.element?.isConnected) {
      this.element.textContent = this.oldText;
    }
  }

  redo() {
    if (this.element?.isConnected) {
      this.element.textContent = this.newText;
    }
  }
}

// Batch of changes that should be undone together
export class BatchChange extends Change {
  constructor(changes) {
    super();
    this.changes = changes;
  }

  undo() {
    // Undo in reverse order
    for (let i = this.changes.length - 1; i >= 0; i--) {
      this.changes[i].undo();
    }
  }

  redo() {
    // Redo in original order
    for (let i = 0; i < this.changes.length; i++) {
      this.changes[i].redo();
    }
  }
}

// History Manager
export class HistoryManager {
  constructor(options = {}) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxSize = options.maxSize || 50;
    this.batchMode = false;
    this.batchedChanges = [];
    this.mergeTimeout = options.mergeTimeout || 1000;
  }

  // Record a change
  push(change) {
    if (this.batchMode) {
      this.batchedChanges.push(change);
      return;
    }

    // Try to merge with the last change if possible
    if (this.undoStack.length > 0) {
      const lastChange = this.undoStack[this.undoStack.length - 1];
      if (lastChange.canMerge(change)) {
        const merged = lastChange.merge(change);
        this.undoStack[this.undoStack.length - 1] = merged;
        this.redoStack = []; // Clear redo stack on new change
        return;
      }
    }

    this.undoStack.push(change);
    this.redoStack = []; // Clear redo stack on new change

    // Enforce size limit
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
  }

  // Begin batch mode for multiple related changes
  beginBatch() {
    this.batchMode = true;
    this.batchedChanges = [];
  }

  // End batch mode and record all changes as one
  endBatch() {
    if (this.batchedChanges.length > 0) {
      const batch = new BatchChange(this.batchedChanges);
      this.undoStack.push(batch);
      this.redoStack = []; // Clear redo stack on new change

      // Enforce size limit
      if (this.undoStack.length > this.maxSize) {
        this.undoStack.shift();
      }
    }
    this.batchMode = false;
    this.batchedChanges = [];
  }

  undo() {
    if (!this.canUndo()) return false;

    const change = this.undoStack.pop();
    try {
      change.undo();
      this.redoStack.push(change);
      return true;
    } catch (error) {
      console.error("Error during undo:", error);
      // Put it back if undo failed
      this.undoStack.push(change);
      return false;
    }
  }

  redo() {
    if (!this.canRedo()) return false;

    const change = this.redoStack.pop();
    try {
      change.redo();
      this.undoStack.push(change);
      return true;
    } catch (error) {
      console.error("Error during redo:", error);
      // Put it back if redo failed
      this.redoStack.push(change);
      return false;
    }
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.batchedChanges = [];
    this.batchMode = false;
  }

  // Get history size (for debugging/UI)
  get size() {
    return {
      undo: this.undoStack.length,
      redo: this.redoStack.length,
    };
  }

  // Get current state (for debugging)
  get state() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoSize: this.undoStack.length,
      redoSize: this.redoStack.length,
      batchMode: this.batchMode,
    };
  }
}

// Export for backward compatibility and convenience
export function History(options) {
  return new HistoryManager(options);
}
