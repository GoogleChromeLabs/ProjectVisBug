export const commands = [
    'zindex',
    'z-index',
    'show z-index',
]

export default function () {
    // Fun prior art https://gist.github.com/paulirish/211209
    const all = document.querySelectorAll('*')
    const filtered = Array.from(all).filter(el => window.getComputedStyle(el).getPropertyValue('z-index') !== 'auto')

    filtered.forEach(el => {
        // Why 16777215? https://dev.to/akhil_001/generating-random-color-with-single-line-of-js-code-fhj
        let color = `#${Math.floor(Math.random() * 16777215).toString(16)}`
        let position = window.getComputedStyle(el).getPropertyValue('position')

        if (position === 'absolute' || position === 'relative') {
            el.style.position === 'relative'
        }

        el.style.outline = `1px solid ${color}`

        let overlay = document.createElement('span')
        let zindex = window.getComputedStyle(el).getPropertyValue('z-index')
        let contrast = '#' +
            (Number('0x' + color.substr(1)).toString(10) > 0xffffff / 2 ? '000000' : 'ffffff')
        overlay.textContent = `z-index: ${zindex}`
        overlay.style.cssText = `background: ${color}; color: ${contrast}; position: 'absolute'; top: 0; left: 0; textIndent: 0;`
        el.appendChild(overlay)
    })
}
