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