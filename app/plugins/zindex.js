import { isFixed } from '../utilities/';

export const commands = [
    'zindex',
    'z-index'
]
function numberBetween(min, max) {
    return Math.floor(min + (Math.random() * (max - min)))
}
export default function () {
    // Fun prior art https://gist.github.com/paulirish/211209
    Array.from(document.querySelectorAll('*'))
        .filter(el => el.computedStyleMap().get('z-index').value !== 'auto')
        .filter(el => el.nodeName !== 'VIS-BUG')
        .forEach(el => {
            const colors = ["#eb4034", "#68eb34", "#34a5eb", "#4334eb", "#b134eb", "#eb34a2", "#eb3446", "#8f2e2b", , "#8f692b", "#8a8f2b", "#358f2b", "#2b8f82", "#2b678f", "#2b2b8f", "#8f2b8f", "#8f2b55", "#1eff00", "#ff9d00", "#ff0000", "#00ff6a", "#0026ff", "#bb00ff", "#ff00d9", "#ff0073", "#ff0073", "#137878"];
            const color = colors[numberBetween(0, colors.length)];
            const zindex = el.computedStyleMap().get('z-index').value

            const label = document.createElement('visbug-label')

            label.text = `z-index: ${zindex}`
            label.position = {
                boundingRect: el.getBoundingClientRect(),
                isFixed: isFixed(el),
            }
            label.style.setProperty(`--label-bg`, color)

            const overlay = document.createElement('visbug-hover')
            overlay.position = { el }
            overlay.style.setProperty(`--hover-stroke`, color)
            overlay.style.setProperty(`--position`, isFixed(el) ? 'fixed' : 'absolute')

            document.body.appendChild(label)
            document.body.appendChild(overlay)
        })
}
