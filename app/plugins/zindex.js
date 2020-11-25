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
            const rgb = [numberBetween(0, 255), numberBetween(0, 255), numberBetween(0, 255)];
            if (rgb[0] > 120 && rgb[1] > 130) {
                if (rgb[2] > 80) {
                    rgb[numberBetween(0, 2)] = 30;
                }
            }
            const color = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
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
