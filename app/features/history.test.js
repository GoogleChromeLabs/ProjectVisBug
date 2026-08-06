import {
  HistoryManager,
  Change,
  StyleChange,
  AttributeChange,
  DOMChange,
  TextChange,
  BatchChange,
} from "./history";

describe("Change Base Class", () => {
  it("should store timestamp on creation", () => {
    const change = new Change();
    expect(change.timestamp).toBeDefined();
    expect(typeof change.timestamp).toBe("number");
  });

  it("should throw error if undo not implemented", () => {
    const change = new Change();
    expect(() => change.undo()).toThrow("undo() must be implemented");
  });

  it("should throw error if redo not implemented", () => {
    const change = new Change();
    expect(() => change.redo()).toThrow("redo() must be implemented");
  });

  it("should not merge by default", () => {
    const change1 = new Change();
    const change2 = new Change();
    expect(change1.canMerge(change2)).toBe(false);
  });
});

describe("StyleChange", () => {
  let element;

  beforeEach(() => {
    element = document.createElement("div");
    document.body.appendChild(element);
    element.style.marginTop = "10px";
  });

  afterEach(() => {
    element.remove();
  });

  it("should undo style change", () => {
    const change = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "10px",
      newValue: "20px",
    });

    element.style.marginTop = "20px";
    expect(element.style.marginTop).toBe("20px");

    change.undo();
    expect(element.style.marginTop).toBe("10px");
  });

  it("should redo style change", () => {
    const change = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "10px",
      newValue: "20px",
    });

    change.redo();
    expect(element.style.marginTop).toBe("20px");
  });

  it("should handle disconnected elements gracefully", () => {
    const change = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "10px",
      newValue: "20px",
    });

    element.remove();

    // Should not throw
    expect(() => change.undo()).not.toThrow();
    expect(() => change.redo()).not.toThrow();
  });

  it("should merge consecutive changes to same property", () => {
    const change1 = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "10px",
      newValue: "20px",
    });

    const change2 = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "20px",
      newValue: "30px",
    });

    expect(change1.canMerge(change2)).toBe(true);

    const merged = change1.merge(change2);
    expect(merged.oldValue).toBe("10px");
    expect(merged.newValue).toBe("30px");
  });

  it("should not merge changes to different properties", () => {
    const change1 = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "10px",
      newValue: "20px",
    });

    const change2 = new StyleChange({
      element,
      property: "marginLeft",
      oldValue: "5px",
      newValue: "15px",
    });

    expect(change1.canMerge(change2)).toBe(false);
  });

  it("should not merge changes to different elements", () => {
    const element2 = document.createElement("div");
    document.body.appendChild(element2);

    const change1 = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "10px",
      newValue: "20px",
    });

    const change2 = new StyleChange({
      element: element2,
      property: "marginTop",
      oldValue: "5px",
      newValue: "15px",
    });

    expect(change1.canMerge(change2)).toBe(false);

    element2.remove();
  });
});

describe("AttributeChange", () => {
  let element;

  beforeEach(() => {
    element = document.createElement("div");
    document.body.appendChild(element);
    element.setAttribute("data-test", "original");
  });

  afterEach(() => {
    element.remove();
  });

  it("should undo attribute change", () => {
    const change = new AttributeChange({
      element,
      attribute: "data-test",
      oldValue: "original",
      newValue: "modified",
    });

    element.setAttribute("data-test", "modified");
    expect(element.getAttribute("data-test")).toBe("modified");

    change.undo();
    expect(element.getAttribute("data-test")).toBe("original");
  });

  it("should redo attribute change", () => {
    const change = new AttributeChange({
      element,
      attribute: "data-test",
      oldValue: "original",
      newValue: "modified",
    });

    change.redo();
    expect(element.getAttribute("data-test")).toBe("modified");
  });

  it("should handle attribute removal on undo", () => {
    const change = new AttributeChange({
      element,
      attribute: "data-test",
      oldValue: null,
      newValue: "added",
    });

    element.setAttribute("data-test", "added");
    change.undo();
    expect(element.hasAttribute("data-test")).toBe(false);
  });

  it("should handle attribute addition on redo", () => {
    const change = new AttributeChange({
      element,
      attribute: "data-new",
      oldValue: null,
      newValue: "added",
    });

    change.redo();
    expect(element.getAttribute("data-new")).toBe("added");
  });
});

describe("DOMChange", () => {
  let parent1, parent2, element, sibling;

  beforeEach(() => {
    parent1 = document.createElement("div");
    parent2 = document.createElement("div");
    element = document.createElement("span");
    sibling = document.createElement("span");

    parent1.appendChild(element);
    parent1.appendChild(sibling);
    document.body.appendChild(parent1);
    document.body.appendChild(parent2);
  });

  afterEach(() => {
    parent1.remove();
    parent2.remove();
  });

  it("should undo element move", () => {
    const change = new DOMChange({
      element,
      oldParent: parent1,
      oldNextSibling: sibling,
      newParent: parent2,
      newNextSibling: null,
    });

    parent2.appendChild(element);
    expect(element.parentNode).toBe(parent2);

    change.undo();
    expect(element.parentNode).toBe(parent1);
    expect(element.nextSibling).toBe(sibling);
  });

  it("should redo element move", () => {
    const change = new DOMChange({
      element,
      oldParent: parent1,
      oldNextSibling: sibling,
      newParent: parent2,
      newNextSibling: null,
    });

    change.redo();
    expect(element.parentNode).toBe(parent2);
  });

  it("should handle appendChild when no next sibling", () => {
    const change = new DOMChange({
      element,
      oldParent: parent1,
      oldNextSibling: null,
      newParent: parent2,
      newNextSibling: null,
    });

    change.undo();
    expect(element.parentNode).toBe(parent1);
    expect(element.nextSibling).toBe(null);
  });
});

describe("TextChange", () => {
  let element;

  beforeEach(() => {
    element = document.createElement("div");
    element.textContent = "Original text";
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it("should undo text change", () => {
    const change = new TextChange({
      element,
      oldText: "Original text",
      newText: "Modified text",
    });

    element.textContent = "Modified text";
    expect(element.textContent).toBe("Modified text");

    change.undo();
    expect(element.textContent).toBe("Original text");
  });

  it("should redo text change", () => {
    const change = new TextChange({
      element,
      oldText: "Original text",
      newText: "Modified text",
    });

    change.redo();
    expect(element.textContent).toBe("Modified text");
  });
});

describe("BatchChange", () => {
  let element;

  beforeEach(() => {
    element = document.createElement("div");
    element.style.marginTop = "10px";
    element.style.paddingTop = "5px";
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it("should undo all changes in reverse order", () => {
    const changes = [
      new StyleChange({
        element,
        property: "marginTop",
        oldValue: "10px",
        newValue: "20px",
      }),
      new StyleChange({
        element,
        property: "paddingTop",
        oldValue: "5px",
        newValue: "15px",
      }),
    ];

    const batch = new BatchChange(changes);

    element.style.marginTop = "20px";
    element.style.paddingTop = "15px";

    batch.undo();
    expect(element.style.marginTop).toBe("10px");
    expect(element.style.paddingTop).toBe("5px");
  });

  it("should redo all changes in original order", () => {
    const changes = [
      new StyleChange({
        element,
        property: "marginTop",
        oldValue: "10px",
        newValue: "20px",
      }),
      new StyleChange({
        element,
        property: "paddingTop",
        oldValue: "5px",
        newValue: "15px",
      }),
    ];

    const batch = new BatchChange(changes);

    batch.redo();
    expect(element.style.marginTop).toBe("20px");
    expect(element.style.paddingTop).toBe("15px");
  });
});

describe("HistoryManager", () => {
  let history, element;

  beforeEach(() => {
    history = new HistoryManager();
    element = document.createElement("div");
    element.style.marginTop = "10px";
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it("should initialize with empty stacks", () => {
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.size.undo).toBe(0);
    expect(history.size.redo).toBe(0);
  });

  it("should push changes to undo stack", () => {
    const change = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "10px",
      newValue: "20px",
    });

    history.push(change);
    expect(history.canUndo()).toBe(true);
    expect(history.size.undo).toBe(1);
  });

  it("should clear redo stack on new change", () => {
    const change1 = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "10px",
      newValue: "20px",
    });

    const change2 = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "20px",
      newValue: "30px",
    });

    history.push(change1);
    history.undo();
    expect(history.canRedo()).toBe(true);

    history.push(change2);
    expect(history.canRedo()).toBe(false);
  });

  it("should undo and move change to redo stack", () => {
    const change = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "10px",
      newValue: "20px",
    });

    history.push(change);
    element.style.marginTop = "20px";

    history.undo();
    expect(element.style.marginTop).toBe("10px");
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
  });

  it("should redo and move change to undo stack", () => {
    const change = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "10px",
      newValue: "20px",
    });

    history.push(change);
    element.style.marginTop = "20px";
    history.undo();

    history.redo();
    expect(element.style.marginTop).toBe("20px");
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it("should enforce max size limit", () => {
    const smallHistory = new HistoryManager({ maxSize: 3 });

    for (let i = 0; i < 5; i++) {
      const change = new StyleChange({
        element,
        property: "marginTop",
        oldValue: `${i * 10}px`,
        newValue: `${(i + 1) * 10}px`,
      });
      smallHistory.push(change);
    }

    expect(smallHistory.size.undo).toBe(3);
  });

  it("should clear all history", () => {
    const change = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "10px",
      newValue: "20px",
    });

    history.push(change);
    history.undo();

    history.clear();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it("should handle batch mode", () => {
    history.beginBatch();

    const change1 = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "10px",
      newValue: "20px",
    });

    const change2 = new StyleChange({
      element,
      property: "paddingTop",
      oldValue: "5px",
      newValue: "15px",
    });

    history.push(change1);
    history.push(change2);

    expect(history.size.undo).toBe(0);

    history.endBatch();

    expect(history.size.undo).toBe(1);
  });

  it("should undo batch as single operation", () => {
    history.beginBatch();

    history.push(
      new StyleChange({
        element,
        property: "marginTop",
        oldValue: "10px",
        newValue: "20px",
      })
    );

    history.push(
      new StyleChange({
        element,
        property: "paddingTop",
        oldValue: "5px",
        newValue: "15px",
      })
    );

    history.endBatch();

    element.style.marginTop = "20px";
    element.style.paddingTop = "15px";

    history.undo();

    expect(element.style.marginTop).toBe("10px");
    expect(element.style.paddingTop).toBe("5px");
    expect(history.canUndo()).toBe(false);
  });

  it("should merge consecutive similar changes", () => {
    const change1 = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "10px",
      newValue: "20px",
    });

    const change2 = new StyleChange({
      element,
      property: "marginTop",
      oldValue: "20px",
      newValue: "30px",
    });

    history.push(change1);
    history.push(change2);

    // Should merge into single change
    expect(history.size.undo).toBe(1);

    element.style.marginTop = "30px";
    history.undo();

    // Should go back to original value
    expect(element.style.marginTop).toBe("10px");
  });

  it("should provide state information", () => {
    const state = history.state;
    expect(state).toHaveProperty("canUndo");
    expect(state).toHaveProperty("canRedo");
    expect(state).toHaveProperty("undoSize");
    expect(state).toHaveProperty("redoSize");
    expect(state).toHaveProperty("batchMode");
  });

  it("should handle errors during undo gracefully", () => {
    const badChange = new Change();
    badChange.undo = () => {
      throw new Error("Test error");
    };

    history.push(badChange);

    const result = history.undo();
    expect(result).toBe(false);
    expect(history.canUndo()).toBe(true); // Should remain in stack
  });

  it("should handle errors during redo gracefully", () => {
    const badChange = new Change();
    badChange.undo = () => {};
    badChange.redo = () => {
      throw new Error("Test error");
    };

    history.push(badChange);
    history.undo();

    const result = history.redo();
    expect(result).toBe(false);
    expect(history.canRedo()).toBe(true); // Should remain in stack
  });
});
