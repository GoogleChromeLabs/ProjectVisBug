import { addToHistory, EditType } from "./history";
import { finder } from '@medv/finder'

export const getUniqueSelector = (el) => {
    let selector = el.tagName.toLowerCase()
    try {
        if (el.nodeType !== Node.ELEMENT_NODE) { return selector }
        // Class names can change too much between states so should ignore.
        selector = finder(el, { className: () => false })
    } catch (e) {
        console.error("Error creating selector ", e);
    }
    return selector
}

const elementSelectorCache = new WeakMap(); // Cache for element selectors

function debounce(func, wait) {
    const timeouts = {};

    return function (...args) {
        const context = this;
        const editEvent = args[0];
        const element = editEvent.el;
        // Use cached selector if available, otherwise compute and cache it
        if (!elementSelectorCache.has(element)) {
            elementSelectorCache.set(
                element,
                getUniqueSelector(element)
            );
        }
        const elementSelector = elementSelectorCache.get(element);

        if (timeouts[elementSelector]) clearTimeout(timeouts[elementSelector]);

        const later = () => {
            delete timeouts[elementSelector];
            func.apply(context, args);
        };

        clearTimeout(timeouts[elementSelector]);
        timeouts[elementSelector] = setTimeout(later, wait);
    };
}

function undebounceHandleEditEvent(param) {
    const selector =
        elementSelectorCache.get(param.el) || getUniqueSelector(param.el);

    const event = {
        createdAt: new Date().toISOString(),
        selector: selector,
        editType: param.editType,
        newVal: param.newValue,
        oldVal: param.oldValue,
    };
    addToHistory(event);
}

let debouncedHandleEditEvent = debounce(undebounceHandleEditEvent, 1000);

export function handleEditEvent(param) {
    if (param.editType === EditType.STYLE || param.editType === EditType.TEXT) {
        debouncedHandleEditEvent(param);
    } else {
        undebounceHandleEditEvent(param);
    }
}