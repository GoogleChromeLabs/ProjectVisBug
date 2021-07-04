import {
  isFixed,
  colors,
  numberBetween
} from '../utilities/'

export const commands = [
    'detect overflows',
    'overflow',
]

export const description = 'find elements that overflow the page body'

export default (elements) => {
    let selectedElements;
    if (elements && elements.selected.length) {
        selectedElements = elements.selected
    } else {
        selectedElements = [document.body]
    }

    document.body.querySelectorAll('visbug-label')
        .forEach((el) => el.remove())

    selectedElements.map(container => {
        const elementsToCheck = container.querySelectorAll('*')
        elementsToCheck.forEach(el => {
            const overflowingX = el.offsetWidth > container.offsetWidth
            const overflowingY = el.offsetHeight > container.offsetHeight
            const isFlag = el.tagName === 'visbug-label'
            const alreadyHasFlag = el.lastChild && el.lastChild.tagName === 'visbug-label'
            if ((overflowingX || overflowingY) && !isFlag && !alreadyHasFlag) {
                const label = document.createElement('visbug-label')
                const overflowingBoth = overflowingX && overflowingY;
                label.text = `overflowing ${overflowingBoth ? 'x and y' : overflowingX ? 'x' : 'y'}`
                label.position = {
                    boundingRect: el.getBoundingClientRect(),
                    isFixed: isFixed(el),
                }
                const color = colors[numberBetween(0, colors.length)]
                label.style.setProperty('--label-bg', color)
                container.appendChild(label)
                el.style.setProperty('outline', `1px solid ${color}`)
            }
        })
    })
}