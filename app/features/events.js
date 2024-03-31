import { addToHistory } from "./history";
import { getUniqueSelector } from "../utilities";

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