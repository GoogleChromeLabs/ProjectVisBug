export const commands = [
    'zindex',
    'z-index'
]

export default function () {
    // Fun prior art https://gist.github.com/paulirish/211209
    Array.from(document.querySelectorAll('*'))
        .filter(el => el.computedStyleMap().get('z-index').value !== 'auto')
        .filter(el => el.nodeName !== 'VIS-BUG')
        .forEach(el => {
            const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`
            const zindex = el.computedStyleMap().get('z-index').value

            const label = document.createElement('visbug-label')

            label.text = `z-index: ${zindex}`
            label.position = {
                boundingRect: el.getBoundingClientRect()
            }
            label.style.setProperty(`--label-bg`, color)

            const overlay = document.createElement('visbug-hover')
            overlay.position = { el }
            overlay.style.setProperty(`--hover-stroke`, color)

            document.body.appendChild(label)
            document.body.appendChild(overlay)
        })
}
